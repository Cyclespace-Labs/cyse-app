"use client";

import { useState, useEffect, useCallback } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import PriceHeader from "@/components/trading/PriceHeader";
import ChartSection from "@/components/trading/ChartSection";
import OrderBook from "@/components/trading/OrderBook";
import TradingPanel from "@/components/trading/TradingPanel";
import BottomTabs from "@/components/trading/BottomTabs";
import BottomTicker from "@/components/trading/BottomTicker";
import TokenPickerDialog from "@/components/trading/TokenPickerDialog";
import { tokenMarkets, TokenMarket } from "@/lib/tokenData";
import { getTokenPriceData } from "@/lib/tradingData";
import { TokenPriceData } from "@/types/trading";
import { useWallet } from "@/contexts/WalletContext";
import { useAllPositions } from "@/hooks/useAllPositions";
import { useOpenOrders } from "@/hooks/useOpenOrders";
import { usePriceOracle } from "@/hooks/usePriceOracle";
import { useTradingActions } from "@/hooks/useTradingActions";
import { useOrderHistory } from "@/hooks/useOrderHistory";
import { usePositionHistory } from "@/hooks/usePositionHistory";
import { useFillHistory } from "@/hooks/useFillHistory";
import { useFundingHistory } from "@/hooks/useFundingHistory";
import { useVaultMarketData } from "@/hooks/useVaultMarketData";
import { useBinance24hData } from "@/hooks/useBinance24hData";
import { contracts } from "@/lib/protocol/contracts";
import { formatUnits, parseUnits } from "viem";
import { OnChainIncreaseOrder, OnChainDecreaseOrder } from "@/types/protocol";
import { Order } from "@/types/trading";

const ETH_TOKEN = tokenMarkets.find((t) => t.symbol === "ETH")!;

const ADDRESS_TO_SYMBOL: Record<string, string> = {
  [contracts.weth.address.toLowerCase()]: "ETH",
  [contracts.btc.address.toLowerCase()]: "BTC",
};

function onChainOrdersToUI(
  increases: OnChainIncreaseOrder[],
  decreases: OnChainDecreaseOrder[]
): Order[] {
  const inc: Order[] = increases.map((o) => ({
    id: `inc-${o.index}`,
    symbol: `${ADDRESS_TO_SYMBOL[o.indexToken.toLowerCase()] ?? "?"}-PERP`,
    side: o.isLong ? "buy" : "sell",
    type: "limit",
    price: parseFloat(formatUnits(o.triggerPrice, 30)),
    quantity: parseFloat(formatUnits(o.sizeDelta, 30)),
    filled: 0,
    status: "open",
    createdAt: Date.now(),
  }));

  // Decrease orders are TP/SL triggers. Distinguish TP vs SL from isLong + triggerAboveThreshold.
  const dec: Order[] = decreases.map((o) => {
    const triggerPrice = parseFloat(formatUnits(o.triggerPrice, 30));
    // TP: long + above, or short + below
    const isTp = (o.isLong && o.triggerAboveThreshold) || (!o.isLong && !o.triggerAboveThreshold);
    return {
      id: `dec-${o.index}`,
      symbol: `${ADDRESS_TO_SYMBOL[o.indexToken.toLowerCase()] ?? "?"}-PERP`,
      side: o.isLong ? "sell" : "buy",
      type: "conditional",
      price: 0, // do not draw a regular order line
      quantity: parseFloat(formatUnits(o.sizeDelta, 30)),
      filled: 0,
      status: "open",
      createdAt: Date.now(),
      tp: isTp ? triggerPrice : undefined,
      sl: isTp ? undefined : triggerPrice,
    };
  });
  return [...inc, ...dec];
}

export default function Home() {
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenMarket>(ETH_TOKEN);
  const [tokenPriceData, setTokenPriceData] = useState<TokenPriceData | null>(null);

  const { wallet } = useWallet();
  const { positions, refetch: refetchPositions } = useAllPositions();
  const { increaseOrders, decreaseOrders, refetch: refetchOrders } = useOpenOrders();
  const { closeMarketPosition, cancelDecreaseOrder } = useTradingActions();

  // History hooks for BottomTabs
  const { orderHistory, isLoading: isLoadingOrderHistory, refresh: refreshOrderHistory } = useOrderHistory();
  const { positionHistory, isLoading: isLoadingPositionHistory, refresh: refreshPositionHistory } = usePositionHistory();
  const { fillHistory, isLoading: isLoadingFillHistory, refresh: refreshFillHistory } = useFillHistory();
  const { fundingHistory, isLoading: isLoadingFundingHistory, isAvailable: fundingAvailable, refresh: refreshFundingHistory } = useFundingHistory();

  const handleRefreshHistory = useCallback(() => {
    refreshOrderHistory();
    refreshPositionHistory();
    refreshFillHistory();
    refreshFundingHistory();
  }, [refreshOrderHistory, refreshPositionHistory, refreshFillHistory, refreshFundingHistory]);

  const handleTradeConfirmed = useCallback(() => {
    refetchPositions();
    refetchOrders();
  }, [refetchPositions, refetchOrders]);

  const symbol = selectedToken.symbol;
  const indexToken: `0x${string}` = (selectedToken.indexAddress ?? contracts.weth.address) as `0x${string}`;
  const collateralToken: `0x${string}` = indexToken;

  // Page-level oracle: Pyth SSE (1s) as primary, VaultPriceFeed as on-chain fallback.
  // TradingPanel has its own internal usePriceOracle call — but only one SSE/RPC per feed
  // because Pyth SSE is de-duplicated per feed ID and wagmi batches on-chain reads.
  const {
    price: livePrice,
    source: oracleSource,
    pythConnected,
  } = usePriceOracle(indexToken);
  const currentPrice = livePrice ?? tokenPriceData?.price ?? 0;

  // Real market data from Vault contract
  const { openInterest, fundingRate, isLoading: isLoadingVaultData } = useVaultMarketData(indexToken);

  // 24h data from Binance API
  const {
    priceChange: binance24hChange,
    priceChangePercent: binance24hChangePercent,
    highPrice: binance24hHigh,
    lowPrice: binance24hLow,
    quoteVolume: binance24hVolume,
    isLoading: isLoadingBinanceData,
  } = useBinance24hData(symbol);

  const orders = onChainOrdersToUI(increaseOrders, decreaseOrders);

  const handleClosePosition = async (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;
    const isLong = pos.side === "long";
    const posIndexToken = pos.symbol.startsWith("BTC")
      ? contracts.btc.address
      : contracts.weth.address;
    const posCollateralToken = isLong
      ? posIndexToken
      : contracts.usdc.address;

    // Cancel attached TP/SL decrease orders first
    const attached = decreaseOrders.filter(
      (o) =>
        o.isLong === isLong &&
        o.indexToken.toLowerCase() === posIndexToken.toLowerCase()
    );
    for (const o of attached) {
      console.log("[page] cancelling attached decrease order", o.index);
      await cancelDecreaseOrder(o.index);
    }

    await closeMarketPosition({
      collateralToken: posCollateralToken,
      indexToken: posIndexToken,
      sizeDelta: 0n, // full close with size=0 triggers contract full close
      collateralDelta: 0n,
      isLong,
      acceptablePrice: parseUnits(currentPrice.toFixed(8), 30),
      slippageBps: 30n,
    });
  };

  useEffect(() => {
    setTokenPriceData(getTokenPriceData(symbol));
  }, [symbol]);

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <TopNavigation />

      <PriceHeader
        onTokenPickerOpen={() => setIsTokenPickerOpen(true)}
        selectedSymbol={`${symbol}-PERP`}
        tokenPriceData={tokenPriceData}
        livePrice={currentPrice}
        pythConnected={pythConnected}
        oracleSource={oracleSource}
        openInterest={openInterest}
        fundingRate={fundingRate}
        isLoadingVaultData={isLoadingVaultData}
        binance24hChange={binance24hChange}
        binance24hChangePercent={binance24hChangePercent}
        binance24hHigh={binance24hHigh}
        binance24hLow={binance24hLow}
        binance24hVolume={binance24hVolume}
        isLoadingBinanceData={isLoadingBinanceData}
      />

      <TokenPickerDialog
        isOpen={isTokenPickerOpen}
        onClose={() => setIsTokenPickerOpen(false)}
        onSelect={(token: TokenMarket) => setSelectedToken(token)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-h-0">
              <ChartSection
                key={symbol}
                symbol={symbol}
                orders={orders}
                positions={positions}
                tokenPriceData={tokenPriceData}
                currentPrice={currentPrice}
              />
            </div>
            <div className="w-[260px] shrink-0">
              <OrderBook symbol={symbol} currentPrice={currentPrice} />
            </div>
          </div>
          <BottomTabs
            isAuthenticated={wallet.connected}
            positions={positions}
            orders={orders}
            currentPrice={currentPrice}
            orderHistory={orderHistory}
            positionHistory={positionHistory}
            fillHistory={fillHistory}
            fundingHistory={fundingHistory}
            fundingAvailable={fundingAvailable}
            isLoadingOrderHistory={isLoadingOrderHistory}
            isLoadingPositionHistory={isLoadingPositionHistory}
            isLoadingFillHistory={isLoadingFillHistory}
            isLoadingFundingHistory={isLoadingFundingHistory}
            onCancelOrder={() => {}}
            onClosePosition={handleClosePosition}
            onRefreshHistory={handleRefreshHistory}
          />
        </div>

        <div className="w-[280px] shrink-0">
          <TradingPanel
            symbol={symbol}
            tokenPriceData={tokenPriceData}
            indexToken={indexToken}
            collateralToken={collateralToken}
            onTradeConfirmed={handleTradeConfirmed}
          />
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

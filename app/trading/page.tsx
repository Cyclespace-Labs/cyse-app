"use client";

import { useState, useEffect } from "react";
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
import { contracts } from "@/lib/protocol/contracts";
import { formatUnits } from "viem";
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
  const dec: Order[] = decreases.map((o) => ({
    id: `dec-${o.index}`,
    symbol: `${ADDRESS_TO_SYMBOL[o.indexToken.toLowerCase()] ?? "?"}-PERP`,
    side: o.isLong ? "sell" : "buy",
    type: "conditional",
    price: parseFloat(formatUnits(o.triggerPrice, 30)),
    quantity: parseFloat(formatUnits(o.sizeDelta, 30)),
    filled: 0,
    status: "open",
    createdAt: Date.now(),
  }));
  return [...inc, ...dec];
}

export default function TradingPage() {
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenMarket>(ETH_TOKEN);
  const [tokenPriceData, setTokenPriceData] = useState<TokenPriceData | null>(null);

  const { wallet } = useWallet();
  const { positions } = useAllPositions();
  const { increaseOrders, decreaseOrders } = useOpenOrders();

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

  const orders = onChainOrdersToUI(increaseOrders, decreaseOrders);

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
            onCancelOrder={() => {}}
            onClosePosition={() => {}}
          />
        </div>

        <div className="w-[280px] shrink-0">
          <TradingPanel
            symbol={symbol}
            tokenPriceData={tokenPriceData}
            indexToken={indexToken}
            collateralToken={collateralToken}
          />
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

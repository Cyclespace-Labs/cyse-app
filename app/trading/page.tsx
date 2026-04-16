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
import { TokenMarket } from "@/lib/tokenData";
import { getTokenPriceData } from "@/lib/tradingData";
import { TokenPriceData } from "@/types/trading";
import { useWallet } from "@/contexts/WalletContext";
import { contracts } from "@/lib/protocol/contracts";

const TOKEN_INDEX_MAP: Record<string, `0x${string}`> = {
  WETH: contracts.weth.address,
  ETH: contracts.weth.address,
};

export default function TradingPage() {
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenMarket | null>(null);
  const [tokenPriceData, setTokenPriceData] = useState<TokenPriceData | null>(null);

  const symbol = selectedToken?.symbol || "SOL";
  const { wallet } = useWallet();

  const indexToken: `0x${string}` | undefined = TOKEN_INDEX_MAP[symbol.toUpperCase()];
  const collateralToken: `0x${string}` | undefined = indexToken;

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
                symbol={symbol}
                orders={[]}
                positions={[]}
                tokenPriceData={tokenPriceData}
              />
            </div>
            <div className="w-[260px] shrink-0">
              <OrderBook />
            </div>
          </div>
          <BottomTabs
            isAuthenticated={wallet.connected}
            positions={[]}
            orders={[]}
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

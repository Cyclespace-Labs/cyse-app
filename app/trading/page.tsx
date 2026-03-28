"use client";

import { useState } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import PriceHeader from "@/components/trading/PriceHeader";
import ChartSection from "@/components/trading/ChartSection";
import OrderBook from "@/components/trading/OrderBook";
import TradingPanel from "@/components/trading/TradingPanel";
import BottomTabs from "@/components/trading/BottomTabs";
import BottomTicker from "@/components/trading/BottomTicker";
import TokenPickerDialog from "@/components/trading/TokenPickerDialog";
import { TokenMarket } from "@/lib/tokenData";

export default function TradingPage() {
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenMarket | null>(null);

  const handleTokenSelect = (token: TokenMarket) => {
    setSelectedToken(token);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Price Header */}
      <PriceHeader
        onTokenPickerOpen={() => setIsTokenPickerOpen(true)}
        selectedSymbol={selectedToken ? `${selectedToken.symbol}-PERP` : undefined}
      />

      {/* Token Picker Dialog */}
      <TokenPickerDialog
        isOpen={isTokenPickerOpen}
        onClose={() => setIsTokenPickerOpen(false)}
        onSelect={handleTokenSelect}
      />

      {/* Main Content: Chart + OrderBook + Trading Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Chart + Bottom Tabs */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0">
            <ChartSection />
          </div>
          <BottomTabs />
        </div>

        {/* Center: Order Book */}
        <div className="w-[260px] shrink-0">
          <OrderBook />
        </div>

        {/* Right: Trading Panel */}
        <div className="w-[280px] shrink-0">
          <TradingPanel />
        </div>
      </div>

      {/* Bottom Ticker */}
      <BottomTicker />
    </div>
  );
}

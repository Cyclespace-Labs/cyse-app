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
import { useTradingState } from "@/hooks/useTradingState";

export default function TradingPage() {
  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenMarket | null>(null);
  const [tokenPriceData, setTokenPriceData] = useState<TokenPriceData | null>(null);

  const symbol = selectedToken?.symbol || "SOL";

  useEffect(() => {
    setTokenPriceData(getTokenPriceData(symbol));
  }, [symbol]);

  const {
    user,
    openOrders,
    activePositions,
    orderPending,
    lastNotification,
    login,
    logout,
    placeOrder,
    cancelOrder,
    closePosition,
  } = useTradingState(symbol);

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
        selectedSymbol={`${symbol}-PERP`}
        tokenPriceData={tokenPriceData}
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
            <ChartSection
              symbol={symbol}
              orders={openOrders}
              positions={activePositions}
              tokenPriceData={tokenPriceData}
            />
          </div>
          <BottomTabs
            isAuthenticated={user.isAuthenticated}
            positions={activePositions}
            orders={openOrders}
            onCancelOrder={cancelOrder}
            onClosePosition={closePosition}
          />
        </div>

        {/* Center: Order Book */}
        <div className="w-[260px] shrink-0">
          <OrderBook />
        </div>

        {/* Right: Trading Panel */}
        <div className="w-[280px] shrink-0">
          <TradingPanel
            user={user}
            symbol={symbol}
            tokenPriceData={tokenPriceData}
            activePositions={activePositions}
            openOrders={openOrders}
            orderPending={orderPending}
            lastNotification={lastNotification}
            onLogin={login}
            onLogout={logout}
            onPlaceOrder={placeOrder}
            onCancelOrder={cancelOrder}
            onClosePosition={closePosition}
          />
        </div>
      </div>

      {/* Bottom Ticker */}
      <BottomTicker />
    </div>
  );
}

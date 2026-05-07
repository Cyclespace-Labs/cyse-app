"use client";

import { useState, useMemo, useEffect } from "react";
import { Order, Position, OrderHistoryEntry, PositionHistoryEntry, FillHistoryEntry, FundingHistoryEntry } from "@/types/trading";
import { X, Loader2 } from "lucide-react";
import { computeLivePnl, computeLivePnlPct } from "@/lib/formatters";
import { formatDistanceToNow } from "@/lib/formatters";

const tabs = [
  "Balances",
  "Positions",
  "Open Orders",
  "Borrows",
  "TWAP",
  "Fill History",
  "Order History",
  "Position History",
  "Funding History",
];

interface BottomTabsProps {
  isAuthenticated?: boolean;
  positions?: Position[];
  orders?: Order[];
  currentPrice?: number;
  
  // History data
  orderHistory?: OrderHistoryEntry[];
  positionHistory?: PositionHistoryEntry[];
  fillHistory?: FillHistoryEntry[];
  fundingHistory?: FundingHistoryEntry[];
  fundingAvailable?: boolean;
  
  // Loading states
  isLoadingOrderHistory?: boolean;
  isLoadingPositionHistory?: boolean;
  isLoadingFillHistory?: boolean;
  isLoadingFundingHistory?: boolean;
  
  onCancelOrder?: (orderId: string) => void;
  onClosePosition?: (positionId: string) => void;
  onRefreshHistory?: () => void;
}

export default function BottomTabs({
  isAuthenticated = false,
  positions = [],
  orders = [],
  currentPrice = 0,
  
  // History data
  orderHistory = [],
  positionHistory = [],
  fillHistory = [],
  fundingHistory = [],
  fundingAvailable = true,
  
  // Loading states
  isLoadingOrderHistory = false,
  isLoadingPositionHistory = false,
  isLoadingFillHistory = false,
  isLoadingFundingHistory = false,
  
  onCancelOrder,
  onClosePosition,
  onRefreshHistory,
}: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState("Balances");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const authed = mounted && isAuthenticated;

  const openOrders = orders.filter((o) => o.status === "open");
  const filledOrders = orders.filter((o) => o.status === "filled");

  const renderContent = () => {
    if (!authed) {
      return (
        <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
          <span>Connect wallet or log in to view your {activeTab.toLowerCase()}</span>
        </div>
      );
    }

    // Loading state component
    const LoadingState = () => (
      <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
        <Loader2 size={14} className="animate-spin mr-2" />
        <span>Loading {activeTab.toLowerCase()}...</span>
      </div>
    );

    if (activeTab === "Positions" && positions.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">Size</th>
                <th className="text-right px-3 py-1.5 font-normal">Entry</th>
                <th className="text-right px-3 py-1.5 font-normal">Liq. Price</th>
                <th className="text-right px-3 py-1.5 font-normal">PnL</th>
                <th className="text-right px-3 py-1.5 font-normal"></th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {positions.map((pos) => (
                <tr
                  key={pos.id}
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{pos.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: pos.side === "long" ? "var(--buy)" : "var(--sell)" }}>
                    {pos.side.toUpperCase()} {pos.leverage}x
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{pos.quantity}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{pos.entryPrice}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--liquidation)" }}>{pos.liquidationPrice.toFixed(4)}</td>
                  {(() => {
                    const livePnl = computeLivePnl(pos.quantity, pos.entryPrice, pos.side === "long", currentPrice, pos.unrealizedPnl);
                    return (
                      <td className="px-3 py-1.5 text-right" style={{ color: livePnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
                        {livePnl >= 0 ? "+" : ""}${livePnl.toFixed(2)}
                      </td>
                    );
                  })()}
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => onClosePosition?.(pos.id)}
                      className="text-[10px] px-2 py-0.5 rounded transition-colors"
                      style={{ border: "1px solid rgba(255,77,79,0.3)", color: "var(--sell)", background: "transparent" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,77,79,0.08)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "Open Orders" && openOrders.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-left px-3 py-1.5 font-normal">Type</th>
                <th className="text-right px-3 py-1.5 font-normal">Price</th>
                <th className="text-right px-3 py-1.5 font-normal">Qty</th>
                <th className="text-right px-3 py-1.5 font-normal"></th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {openOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{order.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: order.side === "buy" ? "var(--buy)" : "var(--sell)" }}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface-muted)" }}>{order.type}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{order.price}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{order.quantity}</td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => onCancelOrder?.(order.id)}
                      className="p-0.5 rounded transition-colors"
                      style={{ color: "var(--on-surface-disabled)" }}
                      title="Cancel"
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
                    >
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Enhanced Fill History with real data
    if (activeTab === "Fill History") {
      if (isLoadingFillHistory) return <LoadingState />;
      if (fillHistory.length === 0 && filledOrders.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No fill history to display</span>
          </div>
        );
      }

      // Combine real fill history with local filled orders
      const allFills = [...fillHistory, ...filledOrders.map(o => ({
        id: o.id,
        orderIndex: 0,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        executionPrice: o.price,
        sizeDelta: o.filled,
        collateralDelta: 0,
        fee: 0,
        txHash: "",
        blockNumber: 0,
        timestamp: o.createdAt,
      }))].sort((a, b) => b.timestamp - a.timestamp);

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-left px-3 py-1.5 font-normal">Type</th>
                <th className="text-right px-3 py-1.5 font-normal">Exec Price</th>
                <th className="text-right px-3 py-1.5 font-normal">Size</th>
                <th className="text-right px-3 py-1.5 font-normal">Fee</th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {allFills.slice(0, 50).map((fill) => (
                <tr 
                  key={fill.id} 
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{fill.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: fill.side === "buy" ? "var(--buy)" : "var(--sell)" }}>
                    {fill.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface-muted)" }}>{fill.type}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${fill.executionPrice.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${fill.sizeDelta.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-muted)" }}>${fill.fee.toFixed(4)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>
                    {formatDistanceToNow(fill.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Order History Tab
    if (activeTab === "Order History") {
      if (isLoadingOrderHistory) return <LoadingState />;
      if (orderHistory.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No order history to display</span>
          </div>
        );
      }

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-left px-3 py-1.5 font-normal">Status</th>
                <th className="text-right px-3 py-1.5 font-normal">Trigger</th>
                <th className="text-right px-3 py-1.5 font-normal">Size</th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.slice(0, 50).map((order) => (
                <tr 
                  key={order.id} 
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{order.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: order.side === "buy" ? "var(--buy)" : "var(--sell)" }}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px]"
                      style={{
                        background: order.status === "created" ? "rgba(99,179,255,0.1)" :
                                   order.status === "cancelled" ? "rgba(255,77,79,0.1)" :
                                   "rgba(0,192,118,0.1)",
                        color: order.status === "created" ? "#63b3ff" :
                               order.status === "cancelled" ? "var(--sell)" :
                               "var(--buy)",
                      }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${order.triggerPrice.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${order.sizeDelta.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>
                    {formatDistanceToNow(order.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Position History Tab
    if (activeTab === "Position History") {
      if (isLoadingPositionHistory) return <LoadingState />;
      if (positionHistory.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No position history to display</span>
          </div>
        );
      }

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Action</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">Price</th>
                <th className="text-right px-3 py-1.5 font-normal">Size</th>
                <th className="text-right px-3 py-1.5 font-normal">PnL</th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {positionHistory.slice(0, 50).map((pos) => (
                <tr 
                  key={pos.id} 
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{pos.symbol}</td>
                  <td className="px-3 py-1.5">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px]"
                      style={{
                        background: pos.action === "increase" ? "rgba(0,192,118,0.1)" :
                                   pos.action === "decrease" ? "rgba(255,171,0,0.1)" :
                                   pos.action === "close" ? "rgba(158,158,158,0.1)" :
                                   "rgba(255,77,79,0.1)",
                        color: pos.action === "increase" ? "var(--buy)" :
                               pos.action === "decrease" ? "#ffab00" :
                               pos.action === "close" ? "var(--on-surface-muted)" :
                               "var(--sell)",
                      }}
                    >
                      {pos.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-1.5" style={{ color: pos.side === "long" ? "var(--buy)" : "var(--sell)" }}>
                    {pos.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${pos.entryPrice.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${pos.sizeDelta.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: pos.pnl && pos.pnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
                    {pos.pnl ? `${pos.pnl >= 0 ? "+" : ""}$${pos.pnl.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>
                    {formatDistanceToNow(pos.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Funding History Tab
    if (activeTab === "Funding History") {
      if (!fundingAvailable) {
        return (
          <div className="flex flex-col items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>Funding history not yet available</span>
            <span className="text-[10px] mt-1">Coming soon</span>
          </div>
        );
      }
      if (isLoadingFundingHistory) return <LoadingState />;
      if (fundingHistory.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No funding history to display</span>
          </div>
        );
      }

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">Rate</th>
                <th className="text-right px-3 py-1.5 font-normal">Fee</th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {fundingHistory.slice(0, 50).map((funding) => (
                <tr 
                  key={funding.id} 
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{funding.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: funding.side === "long" ? "var(--buy)" : "var(--sell)" }}>
                    {funding.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: funding.fundingRate >= 0 ? "var(--buy)" : "var(--sell)" }}>
                    {(funding.fundingRate * 100).toFixed(4)}%
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: funding.fundingFee >= 0 ? "var(--sell)" : "var(--buy)" }}>
                    {funding.fundingFee >= 0 ? "+" : ""}${Math.abs(funding.fundingFee).toFixed(4)}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>
                    {formatDistanceToNow(funding.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
        <span>No {activeTab.toLowerCase()} to display</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ background: "var(--surface-container-lowest)", borderTop: "1px solid rgba(66,70,84,0.4)", borderRight: "1px solid rgba(66,70,84,0.4)", borderLeft: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Tab Header */}
      <div className="flex items-center justify-between overflow-x-auto px-2 scrollbar-hide" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-[12px] whitespace-nowrap transition-colors relative"
            style={{
              color: activeTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)",
              borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            {tab}
            {tab === "Positions" && positions.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--buy)" }}>({positions.length})</span>
            )}
            {tab === "Open Orders" && openOrders.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--tertiary)" }}>({openOrders.length})</span>
            )}
            {tab === "Order History" && orderHistory.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--tertiary)" }}>({orderHistory.length})</span>
            )}
            {tab === "Position History" && positionHistory.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--tertiary)" }}>({positionHistory.length})</span>
            )}
            {tab === "Fill History" && fillHistory.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--buy)" }}>({fillHistory.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}

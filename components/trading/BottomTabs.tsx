"use client";

import { useState } from "react";
import { Order, Position } from "@/types/trading";
import { X } from "lucide-react";

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
  onCancelOrder?: (orderId: string) => void;
  onClosePosition?: (positionId: string) => void;
}

export default function BottomTabs({
  isAuthenticated = false,
  positions = [],
  orders = [],
  onCancelOrder,
  onClosePosition,
}: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState("Balances");

  const openOrders = orders.filter((o) => o.status === "open");
  const filledOrders = orders.filter((o) => o.status === "filled");

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
          <span>Connect wallet or log in to view your {activeTab.toLowerCase()}</span>
        </div>
      );
    }

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
            <tbody>
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
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--liquidation)" }}>{pos.liquidationPrice}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: pos.unrealizedPnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)}
                  </td>
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
            <tbody>
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

    if (activeTab === "Fill History" && filledOrders.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">Price</th>
                <th className="text-right px-3 py-1.5 font-normal">Qty</th>
                <th className="text-right px-3 py-1.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {filledOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}>
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{order.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: order.side === "buy" ? "var(--buy)" : "var(--sell)" }}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{order.price}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{order.filled}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--buy)" }}>Filled</td>
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
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}

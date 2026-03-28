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
        <div className="flex items-center justify-center h-16 text-[#5a5a6a] text-[12px]">
          <span>Connect wallet or log in to view your {activeTab.toLowerCase()}</span>
        </div>
      );
    }

    if (activeTab === "Positions" && positions.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="text-[#5a5a6a] border-b border-[#1c1c28]">
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
                <tr key={pos.id} className="border-b border-[#1c1c28]/50 hover:bg-[#1c1c28]/30">
                  <td className="px-3 py-1.5 text-white">{pos.symbol}</td>
                  <td className={`px-3 py-1.5 ${pos.side === "long" ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {pos.side.toUpperCase()} {pos.leverage}x
                  </td>
                  <td className="px-3 py-1.5 text-white text-right">{pos.quantity}</td>
                  <td className="px-3 py-1.5 text-white text-right">{pos.entryPrice}</td>
                  <td className="px-3 py-1.5 text-[#ff6b35] text-right">{pos.liquidationPrice}</td>
                  <td className={`px-3 py-1.5 text-right ${pos.unrealizedPnl >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => onClosePosition?.(pos.id)}
                      className="text-[10px] px-2 py-0.5 border border-[#ff4d4f]/30 text-[#ff4d4f] rounded hover:bg-[#ff4d4f]/10"
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
              <tr className="text-[#5a5a6a] border-b border-[#1c1c28]">
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
                <tr key={order.id} className="border-b border-[#1c1c28]/50 hover:bg-[#1c1c28]/30">
                  <td className="px-3 py-1.5 text-white">{order.symbol}</td>
                  <td className={`px-3 py-1.5 ${order.side === "buy" ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5 text-[#8a8a9a]">{order.type}</td>
                  <td className="px-3 py-1.5 text-white text-right">{order.price}</td>
                  <td className="px-3 py-1.5 text-white text-right">{order.quantity}</td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => onCancelOrder?.(order.id)}
                      className="p-0.5 text-[#5a5a6a] hover:text-[#ff4d4f]"
                      title="Cancel"
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
              <tr className="text-[#5a5a6a] border-b border-[#1c1c28]">
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">Price</th>
                <th className="text-right px-3 py-1.5 font-normal">Qty</th>
                <th className="text-right px-3 py-1.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {filledOrders.map((order) => (
                <tr key={order.id} className="border-b border-[#1c1c28]/50">
                  <td className="px-3 py-1.5 text-white">{order.symbol}</td>
                  <td className={`px-3 py-1.5 ${order.side === "buy" ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="px-3 py-1.5 text-white text-right">{order.price}</td>
                  <td className="px-3 py-1.5 text-white text-right">{order.filled}</td>
                  <td className="px-3 py-1.5 text-[#00c076] text-right">Filled</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-16 text-[#5a5a6a] text-[12px]">
        <span>No {activeTab.toLowerCase()} to display</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-[#0b0b0e] border-t border-[#1c1c28]">
      {/* Tab Header */}
      <div className="flex items-center overflow-x-auto border-b border-[#1c1c28] px-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-[12px] whitespace-nowrap transition-colors relative ${
              activeTab === tab
                ? "text-white border-b-2 border-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tab}
            {tab === "Positions" && positions.length > 0 && (
              <span className="ml-1 text-[9px] text-[#00c076]">({positions.length})</span>
            )}
            {tab === "Open Orders" && openOrders.length > 0 && (
              <span className="ml-1 text-[9px] text-yellow-400">({openOrders.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}

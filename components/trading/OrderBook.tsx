"use client";

import { useState } from "react";
import { askOrders, bidOrders } from "@/lib/mockData";
import { formatPrice, formatSize } from "@/lib/formatters";

const bookTabs = ["Book", "Trades"];

export default function OrderBook() {
  const [activeTab, setActiveTab] = useState("Book");
  
  const maxAskTotal = Math.max(...askOrders.map((o) => o.total));
  const maxBidTotal = Math.max(...bidOrders.map((o) => o.total));

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface-container-lowest)", borderRight: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Tabs */}
      <div className="flex items-center px-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {bookTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2.5 text-[12px] transition-colors"
            style={{
              color: activeTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)",
              borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-2 py-1.5 text-[10px]" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
        <span>Price (USD)</span>
        <span className="text-right">Size (SOL)</span>
        <span className="text-right">Total (SOL)</span>
      </div>

      {/* Asks (sell orders) - reversed so lowest ask is at bottom */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col justify-end overflow-hidden">
          {[...askOrders].reverse().map((order, i) => (
            <div
              key={`ask-${i}`}
              className="relative grid grid-cols-3 px-2 py-[3px] text-[11px] cursor-pointer group transition-colors"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 depth-bar-sell"
                style={{ width: `${(order.total / maxAskTotal) * 100}%` }}
              />
              <span className="relative z-10 font-mono" style={{ color: "var(--sell)" }}>
                {formatPrice(order.price)}
              </span>
              <span className="text-right relative z-10 font-mono" style={{ color: "var(--on-surface-variant)" }}>
                {formatSize(order.size)}
              </span>
              <span className="text-right relative z-10 font-mono" style={{ color: "var(--on-surface-variant)" }}>
                {formatSize(order.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Spread / Current Price */}
        <div
          className="flex items-center justify-between px-2 py-2"
          style={{
            background: "var(--buy-container)",
            borderTop: "1px solid rgba(66,70,84,0.3)",
            borderBottom: "1px solid rgba(66,70,84,0.3)",
          }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--buy)" }}>86.13</span>
          <span className="text-sm" style={{ color: "var(--on-surface)" }}>86.13</span>
        </div>

        {/* Bids (buy orders) */}
        <div className="flex-1 overflow-hidden">
          {bidOrders.map((order, i) => (
            <div
              key={`bid-${i}`}
              className="relative grid grid-cols-3 px-2 py-[3px] text-[11px] cursor-pointer group transition-colors"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 depth-bar-buy"
                style={{ width: `${(order.total / maxBidTotal) * 100}%` }}
              />
              <span className="relative z-10 font-mono" style={{ color: "var(--buy)" }}>
                {formatPrice(order.price)}
              </span>
              <span className="text-right relative z-10 font-mono" style={{ color: "var(--on-surface-variant)" }}>
                {formatSize(order.size)}
              </span>
              <span className="text-right relative z-10 font-mono" style={{ color: "var(--on-surface-variant)" }}>
                {formatSize(order.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Bid/Ask percentage bar */}
        <div className="relative px-2 py-1.5" style={{ borderTop: "1px solid rgba(66,70,84,0.3)" }}>
          <div className="flex justify-between mb-1">
            <span className="text-[10px]" style={{ color: "var(--buy)" }}>44%</span>
            <span className="text-[10px]" style={{ color: "var(--sell)" }}>56%</span>
          </div>
          <div className="flex w-full h-1 rounded-full overflow-hidden">
            <div style={{ width: "44%", background: "var(--buy)" }} />
            <div style={{ width: "56%", background: "var(--sell)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

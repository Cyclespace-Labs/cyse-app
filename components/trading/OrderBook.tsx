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
    <div className="flex flex-col h-full bg-[#0b0b0e] border-r border-[#1c1c28]">
      {/* Tabs */}
      <div className="flex items-center border-b border-[#1c1c28] px-2">
        {bookTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-[12px] transition-colors ${
              activeTab === tab
                ? "text-white border-b-2 border-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-2 py-1.5 text-[10px] text-[#5a5a6a] border-b border-[#1c1c28]">
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
              className="relative grid grid-cols-3 px-2 py-[3px] text-[11px] hover:bg-[#1c1c28]/50 cursor-pointer group"
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#ff4d4f]/8"
                style={{
                  width: `${(order.total / maxAskTotal) * 100}%`,
                }}
              />
              <span className="text-[#ff4d4f] relative z-10 font-mono">
                {formatPrice(order.price)}
              </span>
              <span className="text-right text-[#c8c8d0] relative z-10 font-mono">
                {formatSize(order.size)}
              </span>
              <span className="text-right text-[#c8c8d0] relative z-10 font-mono">
                {formatSize(order.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Spread / Current Price */}
        <div className="flex items-center justify-between px-2 py-2 bg-[#0d1f15] border-y border-[#1c1c28]">
          <span className="text-[#00c076] text-sm font-bold">86.13</span>
          <span className="text-white text-sm">86.13</span>
        </div>

        {/* Bids (buy orders) */}
        <div className="flex-1 overflow-hidden">
          {bidOrders.map((order, i) => (
            <div
              key={`bid-${i}`}
              className="relative grid grid-cols-3 px-2 py-[3px] text-[11px] hover:bg-[#1c1c28]/50 cursor-pointer group"
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#00c076]/8"
                style={{
                  width: `${(order.total / maxBidTotal) * 100}%`,
                }}
              />
              <span className="text-[#00c076] relative z-10 font-mono">
                {formatPrice(order.price)}
              </span>
              <span className="text-right text-[#c8c8d0] relative z-10 font-mono">
                {formatSize(order.size)}
              </span>
              <span className="text-right text-[#c8c8d0] relative z-10 font-mono">
                {formatSize(order.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Bid/Ask percentage bar */}
        <div className="flex items-center h-5 px-2 border-t border-[#1c1c28]">
          <div className="flex w-full h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#00c076] h-full" style={{ width: "44%" }} />
            <div className="bg-[#ff4d4f] h-full" style={{ width: "56%" }} />
          </div>
          <div className="flex justify-between w-full absolute left-0 right-0 px-2">
            <span className="text-[10px] text-[#00c076]">44%</span>
            <span className="text-[10px] text-[#ff4d4f]">56%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

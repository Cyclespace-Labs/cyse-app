"use client";

import { tickerItems } from "@/lib/mockData";
import { Flame } from "lucide-react";

export default function BottomTicker() {
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="flex items-center h-7 bg-[#0b0b0e] border-t border-[#1c1c28] overflow-hidden">
      {/* Top Movers Label */}
      <div className="flex items-center gap-1.5 px-3 shrink-0 border-r border-[#1c1c28]">
        <Flame size={12} className="text-yellow-400" />
        <span className="text-[11px] text-[#8a8a9a] whitespace-nowrap">Top Movers</span>
      </div>

      {/* Scrolling Ticker */}
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center gap-4 animate-ticker">
          {doubled.map((item, i) => (
            <div
              key={`${item.symbol}-${i}`}
              className="flex items-center gap-1.5 shrink-0 px-1"
            >
              <span className="text-[11px] text-[#8a8a9a] whitespace-nowrap">
                {item.symbol}
              </span>
              <span className="text-[11px] text-white whitespace-nowrap">
                {item.price}
              </span>
              <span
                className={`text-[11px] whitespace-nowrap ${
                  item.change >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                }`}
              >
                ( {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}% )
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side info */}
      <div className="flex items-center gap-3 px-3 shrink-0 border-l border-[#1c1c28]">
        <span className="text-[11px] text-[#8a8a9a] whitespace-nowrap">Hourly Yield</span>
        <span className="text-[11px] text-white">$0.00</span>
      </div>
    </div>
  );
}

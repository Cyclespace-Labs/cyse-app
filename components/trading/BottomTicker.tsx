"use client";

import { tickerItems } from "@/lib/mockData";
import { Flame } from "lucide-react";

export default function BottomTicker() {
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="flex items-center h-7 overflow-hidden" style={{ background: "var(--surface-container-lowest)", borderTop: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Top Movers Label */}
      <div className="flex items-center gap-1.5 px-3 shrink-0" style={{ borderRight: "1px solid rgba(66,70,84,0.4)" }}>
        <Flame size={12} style={{ color: "var(--tertiary)" }} />
        <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--on-surface-muted)" }}>Top Movers</span>
      </div>

      {/* Scrolling Ticker */}
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center gap-4 animate-ticker">
          {doubled.map((item, i) => (
            <div
              key={`${item.symbol}-${i}`}
              className="flex items-center gap-1.5 shrink-0 px-1"
            >
              <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--on-surface-muted)" }}>
                {item.symbol}
              </span>
              <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--on-surface)" }}>
                {item.price}
              </span>
              <span
                className="text-[11px] whitespace-nowrap"
                style={{ color: item.change >= 0 ? "var(--buy)" : "var(--sell)" }}
              >
                ( {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}% )
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side info */}
      <div className="flex items-center gap-3 px-3 shrink-0" style={{ borderLeft: "1px solid rgba(66,70,84,0.4)" }}>
        <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--on-surface-muted)" }}>Hourly Yield</span>
        <span className="text-[11px]" style={{ color: "var(--on-surface)" }}>$0.00</span>
      </div>
    </div>
  );
}

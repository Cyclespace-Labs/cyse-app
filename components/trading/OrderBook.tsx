"use client";

import { useState } from "react";
import { useSimulatedOrderBook } from "@/hooks/useSimulatedOrderBook";
import { formatSize } from "@/lib/formatters";
import { getTickSize } from "@/lib/tradingData";

const bookTabs = ["Book", "Trades"];

interface OrderBookProps {
  symbol?: string;
  currentPrice?: number;
}

function fmtPrice(price: number, decimals: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function OrderBook({ symbol = "ETH", currentPrice = 0 }: OrderBookProps) {
  const [activeTab, setActiveTab] = useState("Book");
  const book = useSimulatedOrderBook(currentPrice);

  const tickSize = currentPrice > 0 ? getTickSize(currentPrice) : 0.01;
  const decimals = Math.max(2, -Math.floor(Math.log10(tickSize || 0.01)));

  const maxAskTotal = book.asks.length > 0 ? Math.max(...book.asks.map((o) => o.total)) : 1;
  const maxBidTotal = book.bids.length > 0 ? Math.max(...book.bids.map((o) => o.total)) : 1;

  const isLoaded = currentPrice > 0;

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
        <span className="text-right">Size ({symbol})</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks — highest at top, lowest at bottom */}
        <div className="flex-1 flex flex-col justify-end overflow-hidden">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>
              Fetching prices…
            </div>
          ) : (
            book.asks.map((order, i) => (
              <div
                key={`ask-${i}`}
                className="relative grid grid-cols-3 px-2 py-[3px] text-[11px] cursor-pointer transition-colors"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 depth-bar-sell"
                  style={{ width: `${(order.total / maxAskTotal) * 100}%` }}
                />
                <span className="relative z-10 font-mono" style={{ color: "var(--sell)" }}>
                  {fmtPrice(order.price, decimals)}
                </span>
                <span className="text-right relative z-10 font-mono" style={{ color: "var(--on-surface-variant)" }}>
                  {formatSize(order.size)}
                </span>
                <span className="text-right relative z-10 font-mono" style={{ color: "var(--on-surface-variant)" }}>
                  {formatSize(order.total)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Mid / Spread row */}
        <div
          className="flex items-center justify-between px-2 py-1.5"
          style={{
            background: "var(--buy-container)",
            borderTop: "1px solid rgba(66,70,84,0.3)",
            borderBottom: "1px solid rgba(66,70,84,0.3)",
          }}
        >
          {isLoaded ? (
            <>
              <span className="text-sm font-bold font-mono" style={{ color: "var(--buy)" }}>
                {fmtPrice(currentPrice, decimals)}
              </span>
              <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
                Spread: {fmtPrice(book.spread, decimals)}
              </span>
            </>
          ) : (
            <span className="text-sm font-mono" style={{ color: "var(--on-surface-disabled)" }}>—</span>
          )}
        </div>

        {/* Bids */}
        <div className="flex-1 overflow-hidden">
          {isLoaded &&
            book.bids.map((order, i) => (
              <div
                key={`bid-${i}`}
                className="relative grid grid-cols-3 px-2 py-[3px] text-[11px] cursor-pointer transition-colors"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 depth-bar-buy"
                  style={{ width: `${(order.total / maxBidTotal) * 100}%` }}
                />
                <span className="relative z-10 font-mono" style={{ color: "var(--buy)" }}>
                  {fmtPrice(order.price, decimals)}
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

        {/* Bid/Ask ratio bar */}
        <div className="px-2 py-1.5" style={{ borderTop: "1px solid rgba(66,70,84,0.3)" }}>
          <div className="flex justify-between mb-1">
            <span className="text-[10px]" style={{ color: "var(--buy)" }}>{book.bidPct}%</span>
            <span className="text-[10px]" style={{ color: "var(--sell)" }}>{book.askPct}%</span>
          </div>
          <div className="flex w-full h-1 rounded-full overflow-hidden">
            <div style={{ width: `${book.bidPct}%`, background: "var(--buy)" }} />
            <div style={{ width: `${book.askPct}%`, background: "var(--sell)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

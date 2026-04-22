"use client";

import { useState, useEffect, useMemo } from "react";
import CandlestickChart from "./CandlestickChart";
import {
  Crosshair,
  Ruler,
  Type,
  Maximize2,
  RotateCcw,
  Camera,
} from "lucide-react";
import { Order, Position, TokenPriceData } from "@/types/trading";
import { formatPrice } from "@/lib/formatters";
import { useCandleData } from "@/hooks/useCandleData";

const chartTabs = ["Chart", "Depth", "Margin", "Funding", "Market Info"];
const timeframes = ["1m", "3m", "5m", "15m", "1h", "4h", "1d"];

interface ChartSectionProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
  tokenPriceData?: TokenPriceData | null;
  currentPrice?: number;
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function ChartSection({ symbol = "SOL", orders = [], positions = [], tokenPriceData, currentPrice }: ChartSectionProps) {
  const [activeTab, setActiveTab] = useState("Chart");
  const [activeTimeframe, setActiveTimeframe] = useState("15m");
  const [utcClock, setUtcClock] = useState("");

  // ── Real candle data from Binance via API ─────────────────────────────────
  const { candles, loading } = useCandleData(symbol, activeTimeframe, currentPrice);

  // ── Derive OHLCV from the latest candle for the info bar ──────────────────
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const firstCandle = candles.length > 0 ? candles[0] : null;

  const ohlcInfo = useMemo(() => {
    if (!lastCandle || !firstCandle) return null;
    const change = lastCandle.close - firstCandle.open;
    const changePct = firstCandle.open !== 0 ? (change / firstCandle.open) * 100 : 0;
    let high = 0, low = Infinity, vol = 0;
    for (const c of candles) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      vol += c.volume;
    }
    return {
      open: firstCandle.open,
      high,
      low,
      close: lastCandle.close,
      change,
      changePct,
      volume: vol,
    };
  }, [candles, lastCandle, firstCandle]);

  useEffect(() => {
    const tick = () => setUtcClock(new Date().toISOString().slice(11, 19) + " [UTC]");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface-container-lowest)", borderRight: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Chart Tabs */}
      <div className="flex items-center px-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {chartTabs.map((tab) => (
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

        {/* Right side: Last / Mark / Index */}
        <div className="ml-auto flex items-center gap-1">
          {["Last", "Mark", "Index"].map((label) => (
            <button
              key={label}
              className="px-2 py-1 text-[11px] rounded transition-colors"
              style={{
                color: label === "Last" ? "var(--on-surface)" : "var(--on-surface-disabled)",
                background: label === "Last" ? "var(--surface-container-high)" : "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe + Tools */}
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className="px-2 py-1 text-[11px] rounded transition-colors"
            style={{
              color: activeTimeframe === tf ? "var(--on-surface)" : "var(--on-surface-disabled)",
              background: activeTimeframe === tf ? "var(--surface-container-high)" : "transparent",
            }}
          >
            {tf}
          </button>
        ))}

        <div className="w-px h-4 mx-1" style={{ background: "rgba(66,70,84,0.4)" }} />

        <button className="px-2 py-1 text-[11px] rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }}>
          Indicators
        </button>
        <button
          className="px-1.5 py-1 text-[11px] rounded font-semibold"
          style={{ color: "var(--tertiary)", background: "rgba(255,182,143,0.1)" }}
        >
          OL
        </button>
        <button className="px-1.5 py-1 text-[11px] rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }}>
          TE
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          {[{ icon: <Crosshair size={14} />, title: "Crosshair" }, { icon: <Ruler size={14} />, title: "Ruler" }, { icon: <Type size={14} />, title: "Text" }, { icon: <Camera size={14} />, title: "Screenshot" }, { icon: <Maximize2 size={14} />, title: "Fullscreen" }].map(({ icon, title }) => (
            <button
              key={title}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--on-surface-disabled)" }}
              title={title}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)" )}
            >
              {icon}
            </button>
          ))}
          <button className="px-2 py-1 text-[11px] rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Pair info bar — OHLCV from real candle data */}
      <div className="flex items-center gap-2 px-3 py-1 text-[11px]" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <span style={{ color: "var(--on-surface)" }}>{symbol}-PERP · {activeTimeframe} · Cyclespace</span>
        <span style={{ color: "var(--on-surface-muted)" }}>·</span>
        {ohlcInfo ? (
          <>
            <span>
              O <span style={{ color: "var(--on-surface)" }}>{formatPrice(ohlcInfo.open)}</span>{" "}
              H <span style={{ color: "var(--on-surface)" }}>{formatPrice(ohlcInfo.high)}</span>{" "}
              L <span style={{ color: "var(--on-surface)" }}>{formatPrice(ohlcInfo.low)}</span>{" "}
              C <span style={{ color: ohlcInfo.change >= 0 ? "var(--buy)" : "var(--sell)" }}>
                {currentPrice && currentPrice > 0 ? formatPrice(currentPrice) : formatPrice(ohlcInfo.close)}
              </span>
            </span>
            <span style={{ color: ohlcInfo.change >= 0 ? "var(--buy)" : "var(--sell)" }}>
              {ohlcInfo.change >= 0 ? "+" : ""}{formatPrice(ohlcInfo.change)} ({ohlcInfo.changePct.toFixed(2)}%)
            </span>
            <span style={{ color: "var(--on-surface-disabled)" }}>
              Vol <span style={{ color: "var(--on-surface-muted)" }}>{fmtVol(ohlcInfo.volume)}</span>
            </span>
          </>
        ) : tokenPriceData ? (
          <>
            <span>
              O <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.openPrice ?? tokenPriceData.price)}</span>{" "}
              H <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.high24h)}</span>{" "}
              L <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.low24h)}</span>{" "}
              C <span style={{ color: tokenPriceData.change24h >= 0 ? "var(--buy)" : "var(--sell)" }}>
                {currentPrice && currentPrice > 0 ? formatPrice(currentPrice) : formatPrice(tokenPriceData.price)}
              </span>
            </span>
          </>
        ) : null}
      </div>

      {/* Chart — native lightweight-charts with real Binance candles + Pyth live price */}
      <div className="flex-1 relative min-h-0">
        {activeTab === "Chart" ? (
          <CandlestickChart
            key={`${symbol}-${activeTimeframe}`}
            candles={candles}
            orders={orders}
            positions={positions}
            currentPrice={currentPrice}
            loading={loading}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[13px]" style={{ color: "var(--on-surface-disabled)" }}>
            {activeTab} — Coming soon
          </div>
        )}
      </div>

      {/* Timerange bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px]" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
        {["All", "1y", "6m", "3m", "1m", "5d", "1d"].map((range) => (
          <button
            key={range}
            className="transition-colors"
            style={{ color: "var(--on-surface-disabled)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
          >
            {range}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2" style={{ color: "var(--on-surface-disabled)" }}>
          <span>{utcClock}</span>
          <span>%</span>
          <span>log</span>
          <span>auto</span>
        </div>
      </div>
    </div>
  );
}

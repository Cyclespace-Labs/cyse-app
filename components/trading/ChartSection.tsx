"use client";

import { useState, useEffect, useRef } from "react";
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
import { TV_PYTH_SYMBOLS } from "@/lib/pyth/config";

const chartTabs = ["Chart", "Depth", "Margin", "Funding", "Market Info"];
const timeframes = ["1m", "3m", "5m", "15m", "1h", "4h", "1d"];

// TradingView script loader (singleton)
let tvScriptPromise: Promise<void> | null = null;
function loadTradingViewScript(): Promise<void> {
  if (tvScriptPromise) return tvScriptPromise;
  tvScriptPromise = new Promise((resolve) => {
    if (typeof window !== "undefined" && "TradingView" in window) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "tradingview-widget-loading-script";
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return tvScriptPromise;
}

interface ChartSectionProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
  tokenPriceData?: TokenPriceData | null;
  currentPrice?: number;
}

export default function ChartSection({ symbol = "SOL", orders = [], positions = [], tokenPriceData, currentPrice }: ChartSectionProps) {
  const [activeTab, setActiveTab] = useState("Chart");
  const [activeTimeframe, setActiveTimeframe] = useState("1m");
  const [utcClock, setUtcClock] = useState("");
  const [tvReady, setTvReady] = useState(false);
  const tvContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<unknown>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcClock(now.toISOString().slice(11, 19) + " [UTC]");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Load TradingView widget with PYTH data feed
  const tvSymbol = TV_PYTH_SYMBOLS[symbol] ?? `PYTH:${symbol}USD`;

  useEffect(() => {
    if (activeTab !== "Chart") return;

    loadTradingViewScript().then(() => {
      setTvReady(true);
      if (!tvContainerRef.current) return;
      // Clear previous widget
      tvContainerRef.current.innerHTML = "";
      tvWidgetRef.current = null;

      try {
        const TradingView = (window as unknown as Record<string, unknown>).TradingView as {
          widget: new (config: Record<string, unknown>) => unknown;
        };
        if (!TradingView?.widget) return;

        tvWidgetRef.current = new TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: activeTimeframe === "1d" ? "D" : activeTimeframe.replace("m", "").replace("h", "60"),
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0e0e11",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_side_toolbar: false,
          container_id: "tradingview-chart-container",
          backgroundColor: "#0e0e11",
          gridColor: "rgba(66,70,84,0.15)",
        });
      } catch (e) {
        console.error("[ChartSection] TradingView widget error:", e);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvSymbol, activeTimeframe, activeTab]);

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

      {/* Pair info bar */}
      <div className="flex items-center gap-2 px-3 py-1 text-[11px]" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <span style={{ color: "var(--on-surface)" }}>{symbol}-PERP · 1 · Cyclespace</span>
        <span style={{ color: "var(--on-surface-muted)" }}>·</span>
        {tokenPriceData && (
          <>
            <span>
              O <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.openPrice ?? tokenPriceData.price)}</span>{" "}
              H <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.high24h)}</span>{" "}
              L <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.low24h)}</span>{" "}
              C <span style={{ color: tokenPriceData.change24h >= 0 ? "var(--buy)" : "var(--sell)" }}>
                {formatPrice(tokenPriceData.price)}
              </span>
            </span>
            <span style={{ color: tokenPriceData.change24h >= 0 ? "var(--buy)" : "var(--sell)" }}>
              {tokenPriceData.change24h >= 0 ? "+" : ""}{formatPrice(tokenPriceData.change24h)} ({tokenPriceData.changePct24h.toFixed(2)}%)
            </span>
            <span style={{ color: "var(--on-surface-disabled)" }}>
              Vol <span style={{ color: "var(--on-surface-muted)" }}>{tokenPriceData.volume24h >= 1e9
                ? `$${(tokenPriceData.volume24h / 1e9).toFixed(2)}B`
                : tokenPriceData.volume24h >= 1e6
                  ? `$${(tokenPriceData.volume24h / 1e6).toFixed(1)}M`
                  : `$${(tokenPriceData.volume24h / 1e3).toFixed(0)}K`}</span>
            </span>
          </>
        )}
      </div>

      {/* Chart — TradingView widget (PYTH data) with lightweight-charts fallback */}
      <div className="flex-1 relative min-h-0">
        {activeTab === "Chart" && tvReady ? (
          <div
            ref={tvContainerRef}
            id="tradingview-chart-container"
            className="absolute inset-0"
          />
        ) : (
          <CandlestickChart symbol={symbol} orders={orders} positions={positions} currentPrice={currentPrice} />
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

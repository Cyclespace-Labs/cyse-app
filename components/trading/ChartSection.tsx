"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import CandlestickChart from "./CandlestickChart";
import {
  Crosshair,
  Ruler,
  Maximize2,
  RotateCcw,
  Camera,
  Layers,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Order, Position, TokenPriceData } from "@/types/trading";
import { formatPrice } from "@/lib/formatters";
import { useCandleData } from "@/hooks/useCandleData";

// Lazy-load TradingView widget (heavy, requires browser APIs)
const TradingViewWidget = dynamic(() => import("./TradingViewWidget"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ color: "var(--on-surface-disabled)" }}>
      <span className="text-[12px]">Loading TradingView...</span>
    </div>
  ),
});

const chartTabs = ["Chart", "Depth", "Margin", "Funding", "Market Info"];
const timeframes = ["1m", "3m", "5m", "15m", "1h", "4h", "1d"];

// ── Visible-range buttons → matching timeframe + candle count ─────────────────
const RANGE_TO_TF: Record<string, { tf: string; label: string }> = {
  "1d":  { tf: "1m",  label: "1 Day" },
  "5d":  { tf: "5m",  label: "5 Days" },
  "1m":  { tf: "15m", label: "1 Month" },
  "3m":  { tf: "1h",  label: "3 Months" },
  "6m":  { tf: "4h",  label: "6 Months" },
  "1y":  { tf: "1d",  label: "1 Year" },
  "All": { tf: "1d",  label: "All" },
};

// ── Built-in indicator presets ────────────────────────────────────────────────
const INDICATOR_PRESETS: Record<string, string[]> = {
  "None":  [],
  "MA":    ["MASimple@tv-basicstudies", "MAExp@tv-basicstudies"],
  "RSI":   ["RSI@tv-basicstudies"],
  "MACD":  ["MACD@tv-basicstudies"],
  "BB":    ["BollingerBands@tv-basicstudies"],
  "Vol":   ["Volume@tv-basicstudies"],
};

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

type ChartMode = "tradingview" | "overlay";
type PriceType = "Last" | "Mark" | "Index";

export default function ChartSection({ symbol = "ETH", orders = [], positions = [], tokenPriceData, currentPrice }: ChartSectionProps) {
  const [activeTab, setActiveTab] = useState("Chart");
  const [activeTimeframe, setActiveTimeframe] = useState("15m");
  const [utcClock, setUtcClock] = useState("");
  const [chartMode, setChartMode] = useState<ChartMode>("tradingview");
  const [tvFailed, setTvFailed] = useState(false);
  const [showOrderLines, setShowOrderLines] = useState(true);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState("None");
  const [priceType, setPriceType] = useState<PriceType>("Last");
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const [isLogScale, setIsLogScale] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const indicatorMenuRef = useRef<HTMLDivElement>(null);

  // ── Real candle data from Binance via API (for OHLCV bar + overlay mode) ──
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
    return { open: firstCandle.open, high, low, close: lastCandle.close, change, changePct, volume: vol };
  }, [candles, lastCandle, firstCandle]);

  // If TradingView fails to load, fall back to lightweight-charts
  useEffect(() => {
    if (tvFailed && chartMode === "tradingview") setChartMode("overlay");
  }, [tvFailed, chartMode]);

  // UTC clock
  useEffect(() => {
    const tick = () => setUtcClock(new Date().toISOString().slice(11, 19) + " [UTC]");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Close indicator menu on outside click
  useEffect(() => {
    if (!showIndicatorMenu) return;
    const handler = (e: MouseEvent) => {
      if (indicatorMenuRef.current && !indicatorMenuRef.current.contains(e.target as Node)) {
        setShowIndicatorMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showIndicatorMenu]);

  // Track fullscreen exit
  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Chart controls ────────────────────────────────────────────────────────
  const handleFullscreen = useCallback(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  }, []);

  const handleScreenshot = useCallback(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    // For TradingView mode: the iframe doesn't allow cross-origin capture.
    // We open a visual prompt instead. The TV widget's own screenshot button works.
    if (chartMode === "tradingview") {
      alert("Tip: Right-click the TradingView chart and select 'Take a snapshot' for a high-quality screenshot, or use the camera icon in the TradingView drawing toolbar.");
      return;
    }
    // For overlay mode: use canvas toBlob
    const canvas = el.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${symbol}-${activeTimeframe}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [chartMode, symbol, activeTimeframe]);

  const handleReset = useCallback(() => {
    // Force re-render by toggling a key suffix
    setActiveRange(null);
  }, []);

  const handleRangeClick = useCallback((range: string) => {
    const mapping = RANGE_TO_TF[range];
    if (mapping) {
      setActiveTimeframe(mapping.tf);
      setActiveRange(range);
    }
  }, []);

  const handleIndicatorSelect = useCallback((name: string) => {
    setActiveIndicator(name);
    setShowIndicatorMenu(false);
    // In overlay mode, indicators are not supported
    if (chartMode === "overlay") {
      setChartMode("tradingview");
    }
  }, [chartMode]);

  const tvStudies = useMemo(() => INDICATOR_PRESETS[activeIndicator] ?? [], [activeIndicator]);

  const displayPrice = currentPrice && currentPrice > 0 ? currentPrice : (ohlcInfo?.close ?? 0);

  return (
    <div
      ref={chartContainerRef}
      className="flex flex-col h-full"
      style={{ background: "var(--surface-container-lowest)", borderRight: "1px solid rgba(66,70,84,0.4)" }}
    >
      {/* ── Chart Tabs ─────────────────────────────────────────────────────── */}
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

        {/* Right side: Price type selector + chart mode toggle */}
        <div className="ml-auto flex items-center gap-1">
          {(["Last", "Mark", "Index"] as PriceType[]).map((label) => (
            <button
              key={label}
              onClick={() => setPriceType(label)}
              className="px-2 py-1 text-[11px] rounded transition-colors"
              style={{
                color: priceType === label ? "var(--on-surface)" : "var(--on-surface-disabled)",
                background: priceType === label ? "var(--surface-container-high)" : "transparent",
              }}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: "rgba(66,70,84,0.4)" }} />
          <button
            onClick={() => setChartMode(chartMode === "tradingview" ? "overlay" : "tradingview")}
            className="px-2 py-1 text-[10px] rounded transition-colors flex items-center gap-1"
            style={{
              color: chartMode === "overlay" ? "var(--primary)" : "var(--on-surface-disabled)",
              background: chartMode === "overlay" ? "rgba(14,118,253,0.1)" : "transparent",
            }}
            title={chartMode === "tradingview" ? "Switch to Overlay mode (positions/orders on chart)" : "Switch to TradingView (full indicators & tools)"}
          >
            <Layers size={12} />
            {chartMode === "overlay" ? "OVL" : "TV"}
          </button>
        </div>
      </div>

      {/* ── Timeframe + Tools ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => { setActiveTimeframe(tf); setActiveRange(null); }}
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

        {/* Indicators dropdown */}
        <div className="relative" ref={indicatorMenuRef}>
          <button
            onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
            className="px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1"
            style={{
              color: activeIndicator !== "None" ? "var(--primary)" : "var(--on-surface-disabled)",
              background: activeIndicator !== "None" ? "rgba(14,118,253,0.1)" : "transparent",
            }}
          >
            <TrendingUp size={12} />
            {activeIndicator !== "None" ? activeIndicator : "Indicators"}
          </button>
          {showIndicatorMenu && (
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-md shadow-lg py-1 min-w-[140px]"
              style={{ background: "var(--surface-container-high)", border: "1px solid rgba(66,70,84,0.6)" }}
            >
              {Object.keys(INDICATOR_PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => handleIndicatorSelect(name)}
                  className="w-full text-left px-3 py-1.5 text-[11px] transition-colors"
                  style={{
                    color: activeIndicator === name ? "var(--primary)" : "var(--on-surface)",
                    background: activeIndicator === name ? "rgba(14,118,253,0.08)" : "transparent",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(66,70,84,0.3)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = activeIndicator === name ? "rgba(14,118,253,0.08)" : "transparent"; }}
                >
                  {name === "None" ? "No Indicators" : name === "MA" ? "Moving Averages (SMA + EMA)" : name === "BB" ? "Bollinger Bands" : name === "Vol" ? "Volume Profile" : name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order Lines toggle */}
        <button
          onClick={() => setShowOrderLines(!showOrderLines)}
          className="px-1.5 py-1 text-[11px] rounded font-semibold transition-colors"
          style={{
            color: showOrderLines ? "var(--tertiary)" : "var(--on-surface-disabled)",
            background: showOrderLines ? "rgba(255,182,143,0.1)" : "transparent",
          }}
          title={showOrderLines ? "Hide order/position lines" : "Show order/position lines"}
        >
          OL
        </button>

        {/* Trading Events toggle */}
        <button
          className="px-1.5 py-1 text-[11px] rounded transition-colors"
          style={{ color: "var(--on-surface-disabled)" }}
          title="Trading events (coming soon)"
        >
          TE
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          {[
            { icon: <Crosshair size={14} />, title: "Crosshair", action: () => {} },
            { icon: <Ruler size={14} />, title: "Measure", action: () => {} },
            { icon: <BarChart3 size={14} />, title: "Chart type", action: () => {} },
            { icon: <Camera size={14} />, title: "Screenshot", action: handleScreenshot },
            { icon: <Maximize2 size={14} />, title: isFullscreen ? "Exit Fullscreen" : "Fullscreen", action: handleFullscreen },
          ].map(({ icon, title, action }) => (
            <button
              key={title}
              onClick={action}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--on-surface-disabled)" }}
              title={title}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
            >
              {icon}
            </button>
          ))}
          <button
            onClick={handleReset}
            className="px-2 py-1 text-[11px] rounded transition-colors"
            style={{ color: "var(--on-surface-disabled)" }}
            title="Reset chart view"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── OHLCV info bar ─────────────────────────────────────────────────── */}
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
                {formatPrice(displayPrice)}
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
          <span>
            O <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.openPrice ?? tokenPriceData.price)}</span>{" "}
            H <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.high24h)}</span>{" "}
            L <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.low24h)}</span>{" "}
            C <span style={{ color: tokenPriceData.change24h >= 0 ? "var(--buy)" : "var(--sell)" }}>
              {formatPrice(displayPrice || tokenPriceData.price)}
            </span>
          </span>
        ) : null}
      </div>

      {/* ── Chart Area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        {activeTab === "Chart" ? (
          chartMode === "tradingview" && !tvFailed ? (
            <TradingViewWidget
              key={`${symbol}-${activeTimeframe}-${activeIndicator}-${activeRange ?? "x"}`}
              symbol={symbol}
              interval={activeTimeframe}
              studies={tvStudies}
              onReady={() => setTvFailed(false)}
              onError={() => setTvFailed(true)}
            />
          ) : (
            <CandlestickChart
              key={`${symbol}-${activeTimeframe}`}
              candles={candles}
              orders={showOrderLines ? orders : []}
              positions={showOrderLines ? positions : []}
              currentPrice={currentPrice}
              loading={loading}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-[13px]" style={{ color: "var(--on-surface-disabled)" }}>
            {activeTab} — Coming soon
          </div>
        )}
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px]" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
        {Object.keys(RANGE_TO_TF).reverse().map((range) => (
          <button
            key={range}
            onClick={() => handleRangeClick(range)}
            className="transition-colors"
            style={{
              color: activeRange === range ? "var(--on-surface)" : "var(--on-surface-disabled)",
              fontWeight: activeRange === range ? 600 : 400,
            }}
            title={RANGE_TO_TF[range].label}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => {
              if (activeRange !== range) (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)";
            }}
          >
            {range}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span style={{ color: "var(--on-surface-disabled)" }}>{utcClock}</span>
          <button
            onClick={() => setIsLogScale(!isLogScale)}
            className="transition-colors"
            style={{ color: isLogScale ? "var(--primary)" : "var(--on-surface-disabled)" }}
            title={isLogScale ? "Switch to linear scale" : "Switch to log scale"}
          >
            log
          </button>
          <button
            onClick={handleReset}
            className="transition-colors"
            style={{ color: "var(--on-surface-disabled)" }}
            title="Auto-fit content"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
          >
            auto
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import CandlestickChart from "./CandlestickChart";
import type { ChartType, IndicatorId, DrawingTool } from "./CandlestickChart";
import type { Drawing } from "@/lib/chart/drawings";
import {
  Crosshair,
  Maximize2,
  RotateCcw,
  Camera,
  TrendingUp,
  MousePointer2,
  Minus,
  ChevronDown,
  TrendingDown,
  MoveUpRight,
  ArrowUpRight,
  MoveHorizontal,
  GripVertical,
  Spline,
  GitBranch,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  Waves,
  ArrowUp,
  ArrowDown,
  Target,
  Type,
  Tag,
  Hash,
  Ruler,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  PenLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Order, Position, TokenPriceData } from "@/types/trading";
import { formatPrice } from "@/lib/formatters";
import { useCandleData } from "@/hooks/useCandleData";

const chartTabs = ["Chart", "Depth", "Margin", "Funding", "Market Info"];
const timeframes = ["1m", "3m", "5m", "15m", "1h", "4h", "1d"];

// ── Range shortcuts → timeframe mapping ──────────────────────────────────────
const RANGE_TO_TF: Record<string, { tf: string; label: string }> = {
  "1d":  { tf: "1m",  label: "1 Day" },
  "5d":  { tf: "5m",  label: "5 Days" },
  "1m":  { tf: "15m", label: "1 Month" },
  "3m":  { tf: "1h",  label: "3 Months" },
  "6m":  { tf: "4h",  label: "6 Months" },
  "1y":  { tf: "1d",  label: "1 Year" },
  "All": { tf: "1d",  label: "All" },
};

// ── Chart type options ───────────────────────────────────────────────────────
const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "Candlestick", label: "Candles" },
  { id: "Bar",         label: "OHLC Bars" },
  { id: "Line",        label: "Line" },
  { id: "Area",        label: "Area" },
  { id: "Baseline",    label: "Baseline" },
];

// ── Indicator definitions (multi-select) ─────────────────────────────────────
const INDICATOR_DEFS: { id: IndicatorId; label: string; color: string }[] = [
  { id: "SMA",  label: "SMA (20)",             color: "#F5C842" },
  { id: "EMA",  label: "EMA (20)",             color: "#E040FB" },
  { id: "BB",   label: "Bollinger Bands (20)",  color: "#42A5F5" },
  { id: "VWAP", label: "VWAP",                 color: "#CE93D8" },
  { id: "RSI",  label: "RSI (14)",             color: "#2196F3" },
  { id: "MACD", label: "MACD (12,26,9)",       color: "#FF9800" },
];

// ── Drawing tool groups (left panel with flyout sub-menus) ───────────────────
interface ToolDef { id: DrawingTool; icon: LucideIcon; label: string }
interface ToolGroup { groupId: string; tools: ToolDef[] }

const TOOL_GROUPS: ToolGroup[] = [
  {
    groupId: "cursor",
    tools: [
      { id: "cursor",    icon: MousePointer2, label: "Pointer" },
      { id: "crosshair", icon: Crosshair,     label: "Crosshair" },
    ],
  },
  {
    groupId: "lines",
    tools: [
      { id: "trendline",     icon: TrendingUp,     label: "Trend Line" },
      { id: "ray",           icon: MoveUpRight,     label: "Ray" },
      { id: "extended_line", icon: MoveHorizontal,  label: "Extended Line" },
      { id: "hline",         icon: Minus,           label: "Horizontal Line" },
      { id: "vline",         icon: GripVertical,    label: "Vertical Line" },
      { id: "arrow",         icon: ArrowUpRight,    label: "Arrow" },
    ],
  },
  {
    groupId: "channels",
    tools: [
      { id: "parallel_channel",   icon: Spline,    label: "Parallel Channel" },
      { id: "regression_channel", icon: TrendingDown, label: "Regression Channel" },
    ],
  },
  {
    groupId: "fibonacci",
    tools: [
      { id: "fib_retrace",   icon: GitBranch,  label: "Fib Retracement" },
      { id: "fib_extension",  icon: GitBranch,  label: "Fib Extension" },
      { id: "fib_channel",    icon: GitBranch,  label: "Fib Channel" },
      { id: "fib_time_zone",  icon: GitBranch,  label: "Fib Time Zone" },
    ],
  },
  {
    groupId: "shapes",
    tools: [
      { id: "rect",     icon: Square,   label: "Rectangle" },
      { id: "circle",   icon: Circle,   label: "Circle" },
      { id: "ellipse",  icon: Hexagon,  label: "Ellipse" },
      { id: "triangle", icon: Triangle, label: "Triangle" },
      { id: "arc",      icon: Spline,   label: "Arc" },
    ],
  },
  {
    groupId: "patterns",
    tools: [
      { id: "xabcd",           icon: Diamond,  label: "XABCD Pattern" },
      { id: "head_shoulders",  icon: Waves,    label: "Head & Shoulders" },
      { id: "cypher",          icon: Diamond,  label: "Cypher Pattern" },
    ],
  },
  {
    groupId: "forecasting",
    tools: [
      { id: "long_position",  icon: ArrowUp,    label: "Long Position" },
      { id: "short_position", icon: ArrowDown,   label: "Short Position" },
      { id: "projection",     icon: Target,      label: "Projection" },
    ],
  },
  {
    groupId: "annotations",
    tools: [
      { id: "text",           icon: Type,     label: "Text" },
      { id: "callout",        icon: Tag,      label: "Callout" },
      { id: "price_label",    icon: Hash,     label: "Price Label" },
      { id: "note",           icon: PenLine,  label: "Note" },
      { id: "anchored_note",  icon: PenLine,  label: "Anchored Note" },
    ],
  },
  {
    groupId: "measurement",
    tools: [
      { id: "price_range",      icon: Ruler, label: "Price Range" },
      { id: "date_range",       icon: Ruler, label: "Date Range" },
      { id: "date_price_range", icon: Ruler, label: "Date & Price Range" },
    ],
  },
];

interface ChartSectionProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
  tokenPriceData?: TokenPriceData | null;
  currentPrice?: number;
}

// ── ToolGroupButton — renders primary icon + fixed-position flyout ────────────
function ToolGroupButton({
  groupId, PrimaryIcon, isActive, isHovered, hasMultiple, selectedTool, tools, drawingTool,
  onPrimaryClick, onHover, onLeave, onFlyoutEnter, onFlyoutLeave, onSelectTool,
}: {
  groupId: string;
  PrimaryIcon: LucideIcon;
  isActive: boolean;
  isHovered: boolean;
  hasMultiple: boolean;
  selectedTool: ToolDef;
  tools: ToolDef[];
  drawingTool: DrawingTool;
  onPrimaryClick: () => void;
  onHover: (groupId: string) => void;
  onLeave: () => void;
  onFlyoutEnter: () => void;
  onFlyoutLeave: () => void;
  onSelectTool: (toolId: string) => void;
}) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isHovered && hasMultiple && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setFlyoutPos({ top: rect.top, left: rect.right + 4 });
    } else {
      setFlyoutPos(null);
    }
  }, [isHovered, hasMultiple]);

  return (
    <div
      ref={btnRef}
      onMouseEnter={() => onHover(groupId)}
      onMouseLeave={onLeave}
    >
      <button
        onClick={onPrimaryClick}
        className="p-1.5 rounded transition-colors relative"
        title={selectedTool.label}
        style={{
          color: isActive ? "var(--primary)" : "var(--on-surface-disabled)",
          background: isActive ? "rgba(14,118,253,0.12)" : "transparent",
        }}
      >
        <PrimaryIcon size={15} />
        {hasMultiple && (
          <span
            className="absolute bottom-0.5 right-0.5"
            style={{ width: 0, height: 0, borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderTop: "3px solid currentColor", opacity: 0.5 }}
          />
        )}
      </button>

      {/* Fixed-position flyout — escapes any overflow:hidden ancestors */}
      {isHovered && hasMultiple && flyoutPos && (
        <div
          className="rounded-md shadow-lg py-1 min-w-[160px]"
          style={{
            position: "fixed",
            top: flyoutPos.top,
            left: flyoutPos.left,
            zIndex: 9999,
            background: "var(--surface-container-high)",
            border: "1px solid rgba(66,70,84,0.6)",
          }}
          onMouseEnter={onFlyoutEnter}
          onMouseLeave={onFlyoutLeave}
        >
          {tools.map(({ id, icon: ToolIcon, label }) => (
            <button
              key={id}
              onClick={() => onSelectTool(id)}
              className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors hover:bg-white/5"
              style={{
                color: drawingTool === id ? "var(--primary)" : "var(--on-surface)",
                background: drawingTool === id ? "rgba(14,118,253,0.08)" : "transparent",
              }}
            >
              <ToolIcon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

type PriceType = "Last" | "Mark" | "Index";

// ── LocalStorage persistence helpers ─────────────────────────────────────────
const STORAGE_PREFIX = "cyse_chart_";
function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch { /* ignore */ }
}

export default function ChartSection({ symbol = "ETH", orders = [], positions = [], tokenPriceData, currentPrice }: ChartSectionProps) {
  const [activeTab, setActiveTab] = useState("Chart");
  const [activeTimeframe, setActiveTimeframe] = useState(() => loadJSON<string>(`${symbol}_tf`, "15m"));
  const [utcClock, setUtcClock] = useState("");
  const [chartType, setChartType] = useState<ChartType>(() => loadJSON<ChartType>(`${symbol}_chartType`, "Candlestick"));
  const [activeIndicators, setActiveIndicators] = useState<IndicatorId[]>(() => loadJSON<IndicatorId[]>(`${symbol}_indicators`, []));
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("cursor");
  const [showOrderLines, setShowOrderLines] = useState(() => loadJSON<boolean>(`${symbol}_orderLines`, true));
  const [priceType, setPriceType] = useState<PriceType>("Last");
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const [isLogScale, setIsLogScale] = useState(() => loadJSON<boolean>(`${symbol}_logScale`, false));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [drawingsVisible, setDrawingsVisible] = useState(true);
  const [drawingsLocked, setDrawingsLocked] = useState(false);
  // Drawings state — persisted to localStorage
  const [savedDrawings] = useState<Drawing[]>(() => loadJSON<Drawing[]>(`${symbol}_drawings`, []));
  // Track the last-selected tool per group so the primary button shows the right icon
  const [selectedPerGroup, setSelectedPerGroup] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of TOOL_GROUPS) init[g.groupId] = g.tools[0].id;
    return init;
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartTypeMenuRef = useRef<HTMLDivElement>(null);
  const indicatorMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persist chart state on change ──────────────────────────────────────────
  useEffect(() => { saveJSON(`${symbol}_tf`, activeTimeframe); }, [symbol, activeTimeframe]);
  useEffect(() => { saveJSON(`${symbol}_chartType`, chartType); }, [symbol, chartType]);
  useEffect(() => { saveJSON(`${symbol}_indicators`, activeIndicators); }, [symbol, activeIndicators]);
  useEffect(() => { saveJSON(`${symbol}_orderLines`, showOrderLines); }, [symbol, showOrderLines]);
  useEffect(() => { saveJSON(`${symbol}_logScale`, isLogScale); }, [symbol, isLogScale]);

  // ── Candle data ───────────────────────────────────────────────────────────
  const { candles, loading } = useCandleData(symbol, activeTimeframe, currentPrice);

  // ── OHLCV info bar ────────────────────────────────────────────────────────
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

  // UTC clock
  useEffect(() => {
    const tick = () => setUtcClock(new Date().toISOString().slice(11, 19) + " [UTC]");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    if (!showChartTypeMenu && !showIndicatorMenu) return;
    const handler = (e: MouseEvent) => {
      if (chartTypeMenuRef.current && !chartTypeMenuRef.current.contains(e.target as Node)) setShowChartTypeMenu(false);
      if (indicatorMenuRef.current && !indicatorMenuRef.current.contains(e.target as Node)) setShowIndicatorMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showChartTypeMenu, showIndicatorMenu]);

  // Track fullscreen exit
  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleFullscreen = useCallback(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen(); setIsFullscreen(false); }
    else { el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {}); }
  }, []);

  const handleScreenshot = useCallback(() => {
    const el = chartContainerRef.current;
    if (!el) return;
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
  }, [symbol, activeTimeframe]);

  const toggleIndicator = useCallback((id: IndicatorId) => {
    setActiveIndicators((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleRangeClick = useCallback((range: string) => {
    const m = RANGE_TO_TF[range];
    if (m) { setActiveTimeframe(m.tf); setActiveRange(range); }
  }, []);

  const selectToolFromGroup = useCallback((groupId: string, toolId: DrawingTool) => {
    setSelectedPerGroup((prev) => ({ ...prev, [groupId]: toolId }));
    setDrawingTool(toolId);
    setHoveredGroup(null);
  }, []);

  const handleDrawingsChange = useCallback((drawings: Drawing[]) => {
    saveJSON(`${symbol}_drawings`, drawings);
  }, [symbol]);

  const handleClearDrawings = useCallback(() => {
    saveJSON(`${symbol}_drawings`, []);
    setDrawingTool("cursor");
  }, [symbol]);

  const displayPrice = currentPrice && currentPrice > 0 ? currentPrice : (ohlcInfo?.close ?? 0);

  // ── Indicator badge text ──────────────────────────────────────────────────
  const indicatorBadge = activeIndicators.length > 0 ? activeIndicators.join(", ") : "Indicators";

  // Style helpers
  const bdr = "1px solid rgba(66,70,84,0.4)";
  const toolBtn = (active: boolean) => ({
    color: active ? "var(--on-surface)" : "var(--on-surface-disabled)",
    background: active ? "var(--surface-container-high)" : "transparent",
  });

  return (
    <div ref={chartContainerRef} className="flex flex-col h-full" style={{ background: "var(--surface-container-lowest)", borderRight: bdr }}>

      {/* ── Chart Tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center px-2" style={{ borderBottom: bdr }}>
        {chartTabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-3 py-2.5 text-[12px] transition-colors"
            style={{ color: activeTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)", borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent" }}>
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          {(["Last", "Mark", "Index"] as PriceType[]).map((label) => (
            <button key={label} onClick={() => setPriceType(label)} className="px-2 py-1 text-[11px] rounded transition-colors" style={toolBtn(priceType === label)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeframe + Chart type + Indicators + Tools ──────────────────── */}
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: bdr }}>
        {timeframes.map((tf) => (
          <button key={tf} onClick={() => { setActiveTimeframe(tf); setActiveRange(null); }}
            className="px-2 py-1 text-[11px] rounded transition-colors" style={toolBtn(activeTimeframe === tf)}>
            {tf}
          </button>
        ))}

        <div className="w-px h-4 mx-1" style={{ background: "rgba(66,70,84,0.4)" }} />

        {/* Chart type dropdown */}
        <div className="relative" ref={chartTypeMenuRef}>
          <button onClick={() => { setShowChartTypeMenu(!showChartTypeMenu); setShowIndicatorMenu(false); }}
            className="px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1"
            style={{ color: "var(--on-surface-disabled)" }}>
            {CHART_TYPES.find((t) => t.id === chartType)?.label ?? "Candles"}
            <ChevronDown size={10} />
          </button>
          {showChartTypeMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded-md shadow-lg py-1 min-w-[120px]" style={{ background: "var(--surface-container-high)", border: "1px solid rgba(66,70,84,0.6)" }}>
              {CHART_TYPES.map(({ id, label }) => (
                <button key={id} onClick={() => { setChartType(id); setShowChartTypeMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5"
                  style={{ color: chartType === id ? "var(--primary)" : "var(--on-surface)", background: chartType === id ? "rgba(14,118,253,0.08)" : "transparent" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators dropdown (multi-select) */}
        <div className="relative" ref={indicatorMenuRef}>
          <button onClick={() => { setShowIndicatorMenu(!showIndicatorMenu); setShowChartTypeMenu(false); }}
            className="px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1"
            style={{ color: activeIndicators.length > 0 ? "var(--primary)" : "var(--on-surface-disabled)", background: activeIndicators.length > 0 ? "rgba(14,118,253,0.1)" : "transparent" }}>
            <TrendingUp size={12} />
            {indicatorBadge}
            <ChevronDown size={10} />
          </button>
          {showIndicatorMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded-md shadow-lg py-1 min-w-[180px]" style={{ background: "var(--surface-container-high)", border: "1px solid rgba(66,70,84,0.6)" }}>
              {INDICATOR_DEFS.map(({ id, label, color }) => {
                const active = activeIndicators.includes(id);
                return (
                  <button key={id} onClick={() => toggleIndicator(id)}
                    className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors hover:bg-white/5"
                    style={{ color: active ? "var(--primary)" : "var(--on-surface)" }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? color : "transparent", border: active ? "none" : `1px solid ${color}` }} />
                    {label}
                    {active && <span className="ml-auto text-[10px] opacity-60">ON</span>}
                  </button>
                );
              })}
              {activeIndicators.length > 0 && (
                <>
                  <div className="h-px my-1" style={{ background: "rgba(66,70,84,0.4)" }} />
                  <button onClick={() => setActiveIndicators([])}
                    className="w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5"
                    style={{ color: "var(--sell)" }}>
                    Clear all
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* OL toggle */}
        <button onClick={() => setShowOrderLines(!showOrderLines)}
          className="px-1.5 py-1 text-[11px] rounded font-semibold transition-colors"
          style={{ color: showOrderLines ? "var(--tertiary)" : "var(--on-surface-disabled)", background: showOrderLines ? "rgba(255,182,143,0.1)" : "transparent" }}
          title={showOrderLines ? "Hide order/position lines" : "Show order/position lines"}>
          OL
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={handleScreenshot} className="p-1 rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }} title="Screenshot"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
            <Camera size={14} />
          </button>
          <button onClick={handleFullscreen} className="p-1 rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
            <Maximize2 size={14} />
          </button>
          <button onClick={() => setActiveRange(null)} className="p-1 rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }} title="Reset"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── OHLCV info bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1 text-[11px]" style={{ color: "var(--on-surface-disabled)", borderBottom: bdr }}>
        <span style={{ color: "var(--on-surface)" }}>{symbol}-PERP · {activeTimeframe} · Cyclespace</span>
        <span style={{ color: "var(--on-surface-muted)" }}>·</span>
        {ohlcInfo ? (
          <>
            <span>
              O <span style={{ color: "var(--on-surface)" }}>{formatPrice(ohlcInfo.open)}</span>{" "}
              H <span style={{ color: "var(--on-surface)" }}>{formatPrice(ohlcInfo.high)}</span>{" "}
              L <span style={{ color: "var(--on-surface)" }}>{formatPrice(ohlcInfo.low)}</span>{" "}
              C <span style={{ color: ohlcInfo.change >= 0 ? "var(--buy)" : "var(--sell)" }}>{formatPrice(displayPrice)}</span>
            </span>
            <span style={{ color: ohlcInfo.change >= 0 ? "var(--buy)" : "var(--sell)" }}>
              {ohlcInfo.change >= 0 ? "+" : ""}{formatPrice(ohlcInfo.change)} ({ohlcInfo.changePct.toFixed(2)}%)
            </span>
            <span>Vol <span style={{ color: "var(--on-surface-muted)" }}>{fmtVol(ohlcInfo.volume)}</span></span>
          </>
        ) : tokenPriceData ? (
          <span>
            O <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.openPrice ?? tokenPriceData.price)}</span>{" "}
            H <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.high24h)}</span>{" "}
            L <span style={{ color: "var(--on-surface)" }}>{formatPrice(tokenPriceData.low24h)}</span>{" "}
            C <span style={{ color: tokenPriceData.change24h >= 0 ? "var(--buy)" : "var(--sell)" }}>{formatPrice(displayPrice || tokenPriceData.price)}</span>
          </span>
        ) : null}
      </div>

      {/* ── Chart Area = LEFT DRAWING PANEL + CHART ──────────────────────── */}
      <div className="flex-1 flex min-h-0" style={{ overflow: "visible" }}>
        {/* Left drawing tools panel — grouped with flyout sub-menus */}
        {activeTab === "Chart" && (
          <div
            className="flex flex-col items-center py-1.5 gap-0.5"
            style={{ width: 38, borderRight: bdr, flexShrink: 0, overflow: "visible" }}
          >
            {TOOL_GROUPS.map((group) => {
              const selectedId = selectedPerGroup[group.groupId] ?? group.tools[0].id;
              const selectedTool = group.tools.find((t) => t.id === selectedId) ?? group.tools[0];
              const PrimaryIcon = selectedTool.icon;
              const isActive = group.tools.some((t) => t.id === drawingTool);
              const isHovered = hoveredGroup === group.groupId;
              const hasMultiple = group.tools.length > 1;

              return (
                <ToolGroupButton
                  key={group.groupId}
                  groupId={group.groupId}
                  PrimaryIcon={PrimaryIcon}
                  isActive={isActive}
                  isHovered={isHovered}
                  hasMultiple={hasMultiple}
                  selectedTool={selectedTool}
                  tools={group.tools}
                  drawingTool={drawingTool}
                  onPrimaryClick={() => setDrawingTool(selectedTool.id as DrawingTool)}
                  onHover={(gId) => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    if (hasMultiple) setHoveredGroup(gId);
                  }}
                  onLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => setHoveredGroup(null), 200);
                  }}
                  onFlyoutEnter={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  }}
                  onFlyoutLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => setHoveredGroup(null), 200);
                  }}
                  onSelectTool={(toolId) => selectToolFromGroup(group.groupId, toolId as DrawingTool)}
                />
              );
            })}

            {/* Separator */}
            <div className="h-px w-5 my-0.5" style={{ background: "rgba(66,70,84,0.4)" }} />

            {/* Erase all */}
            <button
              onClick={() => setDrawingTool("erase_all")}
              className="p-1.5 rounded transition-colors"
              title="Erase all drawings"
              style={{ color: "var(--on-surface-disabled)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
            >
              <Trash2 size={15} />
            </button>

            {/* Toggle visibility */}
            <button
              onClick={() => setDrawingsVisible(!drawingsVisible)}
              className="p-1.5 rounded transition-colors"
              title={drawingsVisible ? "Hide drawings" : "Show drawings"}
              style={{ color: drawingsVisible ? "var(--on-surface-disabled)" : "var(--primary)" }}
            >
              {drawingsVisible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>

            {/* Lock */}
            <button
              onClick={() => setDrawingsLocked(!drawingsLocked)}
              className="p-1.5 rounded transition-colors"
              title={drawingsLocked ? "Unlock drawings" : "Lock drawings"}
              style={{ color: drawingsLocked ? "var(--primary)" : "var(--on-surface-disabled)" }}
            >
              <Lock size={15} />
            </button>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 relative min-h-0 min-w-0">
          {activeTab === "Chart" ? (
            <CandlestickChart
              key={`${symbol}-${activeTimeframe}-${chartType}`}
              candles={candles}
              chartType={chartType}
              indicators={activeIndicators}
              logScale={isLogScale}
              drawingTool={drawingsLocked ? "cursor" : drawingTool}
              showOrderLines={showOrderLines}
              orders={orders}
              positions={positions}
              currentPrice={currentPrice}
              loading={loading}
              initialDrawings={savedDrawings}
              onDrawingsChange={handleDrawingsChange}
              onClearDrawings={handleClearDrawings}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[13px]" style={{ color: "var(--on-surface-disabled)" }}>
              {activeTab} — Coming soon
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px]" style={{ borderTop: bdr }}>
        {Object.keys(RANGE_TO_TF).reverse().map((range) => (
          <button key={range} onClick={() => handleRangeClick(range)} className="transition-colors"
            style={{ color: activeRange === range ? "var(--on-surface)" : "var(--on-surface-disabled)", fontWeight: activeRange === range ? 600 : 400 }}
            title={RANGE_TO_TF[range].label}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => { if (activeRange !== range) (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)"; }}>
            {range}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span style={{ color: "var(--on-surface-disabled)" }}>{utcClock}</span>
          <button onClick={() => setIsLogScale(!isLogScale)} className="transition-colors"
            style={{ color: isLogScale ? "var(--primary)" : "var(--on-surface-disabled)" }}
            title={isLogScale ? "Switch to linear scale" : "Switch to log scale"}>
            log
          </button>
          <button onClick={() => setActiveRange(null)} className="transition-colors"
            style={{ color: "var(--on-surface-disabled)" }} title="Auto-fit content"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
            auto
          </button>
        </div>
      </div>
    </div>
  );
}

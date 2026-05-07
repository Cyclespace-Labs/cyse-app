"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineStyle,
} from "lightweight-charts";
import { Order, Position } from "@/types/trading";
import { useTheme } from "@/contexts/ThemeContext";
import type { Candle } from "@/hooks/useCandleData";
import {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBB,
  computeVWAP,
} from "@/lib/chart/indicators";
import {
  type DrawingToolId,
  type Drawing,
  type DrawingPoint,
  isDrawingTool,
  TOOL_POINTS,
  createDrawing,
  makeConverter,
  renderDrawings,
  hitTestDrawing,
  moveDrawing,
  renderSelectionHandles,
} from "@/lib/chart/drawings";

// ── Types ────────────────────────────────────────────────────────────────────
export type ChartType = "Candlestick" | "Bar" | "Line" | "Area" | "Baseline";
export type IndicatorId = "SMA" | "EMA" | "RSI" | "MACD" | "BB" | "VWAP";
export type DrawingTool = DrawingToolId;

interface CandlestickChartProps {
  candles: Candle[];
  chartType?: ChartType;
  indicators?: IndicatorId[];
  logScale?: boolean;
  drawingTool?: DrawingTool;
  showOrderLines?: boolean;
  orders?: Order[];
  positions?: Position[];
  currentPrice?: number;
  loading?: boolean;
  initialDrawings?: Drawing[];
  onDrawingsChange?: (drawings: Drawing[]) => void;
  onClearDrawings?: () => void;
}

/** Resolve a CSS background-color from a DOM element to a hex string.
 *  Reads the browser-computed value and normalises via canvas fillStyle,
 *  which always returns a #rrggbb hex. Falls back to the provided default. */
function resolveElBg(el: HTMLElement, fallback: string): string {
  try {
    const raw = getComputedStyle(el).backgroundColor;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = raw;
    return ctx.fillStyle; // browser normalises to #rrggbb
  } catch {
    return fallback;
  }
}

/** Chart color palettes keyed by theme.
 *  lightweight-charts only accepts hex / rgb strings — never oklch/lab.
 *  bg is resolved at runtime from the container element. */
const CHART_COLORS = {
  dark: {
    bg:          "#0f172a",  /* slate-900 — overridden at runtime */
    text:        "#64748b",  /* slate-500 */
    grid:        "#33415518", /* slate-700 + 10% alpha */
    crosshair:   "#94a3b8",  /* slate-400 */
    scaleBorder: "#33415530", /* slate-700 + 19% alpha */
    buy:         "#00c076",
    buyBright:   "#00d884",
    sell:        "#ff4d4f",
    sellBright:  "#ff6b6d",
    liq:         "#ff6b35",
    warning:     "#ffb68f",
    primary:     "#0E76FD",
  },
  light: {
    bg:          "#ffffff",  /* white */
    text:        "#94a3b8",  /* slate-400 */
    grid:        "#cbd5e118", /* slate-300 + 10% alpha */
    crosshair:   "#64748b",  /* slate-500 */
    scaleBorder: "#cbd5e130", /* slate-300 + 19% alpha */
    buy:         "#00a866",
    buyBright:   "#00c076",
    sell:        "#e53935",
    sellBright:  "#ff5252",
    liq:         "#ff6b35",
    warning:     "#f57c00",
    primary:     "#0E76FD",
  },
} as const;

// Indicator colour palette
const IND_COLORS = {
  sma: "#F5C842",
  ema: "#E040FB",
  rsi: "#2196F3",
  macdLine: "#2196F3",
  macdSignal: "#FF9800",
  macdHistUp: "#00c07640",
  macdHistDn: "#ff4d4f40",
  bbUpper: "#42A5F5",
  bbMiddle: "#90CAF9",
  bbLower: "#42A5F5",
  vwap: "#CE93D8",
};

export default function CandlestickChart({
  candles: candleData,
  chartType = "Candlestick",
  indicators = [],
  logScale = false,
  drawingTool = "cursor",
  showOrderLines = true,
  orders = [],
  positions = [],
  currentPrice,
  loading,
  initialDrawings,
  onDrawingsChange,
  onClearDrawings,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indicatorSeriesRef = useRef<ISeriesApi<any>[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayLinesRef = useRef<any[]>([]);
  const currentPriceLineRef = useRef<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlinePriceLines = useRef<any[]>([]);
  const prevDataKeyRef = useRef("");
  const drawingsRef = useRef<Drawing[]>(initialDrawings ?? []);
  const pendingPointsRef = useRef<DrawingPoint[]>([]);
  const cursorPosRef = useRef<DrawingPoint | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<DrawingPoint | null>(null);
  const drawingToolRef = useRef<DrawingTool>(drawingTool);
  const onDrawingsChangeRef = useRef(onDrawingsChange);
  const { theme } = useTheme();

  // Keep refs in sync with latest props
  drawingToolRef.current = drawingTool;
  onDrawingsChangeRef.current = onDrawingsChange;

  const indicatorsKey = indicators.slice().sort().join(",");

  const getColors = useCallback(
    () => CHART_COLORS[theme === "light" ? "light" : "dark"],
    [theme]
  );

  // ── Compute indicator data from candle array ──────────────────────────────
  const indicatorData = useMemo(() => {
    if (!candleData.length) return null;
    const hasRSI = indicators.includes("RSI");
    const hasMACD = indicators.includes("MACD");
    const bottomPaneCount = (hasRSI ? 1 : 0) + (hasMACD ? 1 : 0);
    return {
      sma: indicators.includes("SMA") ? computeSMA(candleData, 20) : null,
      ema: indicators.includes("EMA") ? computeEMA(candleData, 20) : null,
      rsi: hasRSI ? computeRSI(candleData, 14) : null,
      macd: hasMACD ? computeMACD(candleData) : null,
      bb: indicators.includes("BB") ? computeBB(candleData) : null,
      vwap: indicators.includes("VWAP") ? computeVWAP(candleData) : null,
      bottomPaneCount,
    };
  }, [candleData, indicators]);

  // ── Effect 1 — Build chart + all series (structural rebuild) ──────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const c = getColors();
    const resolvedBg = resolveElBg(el, c.bg);
    const hasBottomPane = indicatorData ? indicatorData.bottomPaneCount > 0 : false;
    const mainBottom = hasBottomPane ? 0.38 : 0.22;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: resolvedBg },
        textColor: c.text,
        fontSize: 11,
        fontFamily: "'Alexandria', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: c.grid, style: LineStyle.Dotted },
        horzLines: { color: c.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: drawingToolRef.current === "crosshair" ? 1 : 0,
        vertLine: { color: c.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: resolvedBg },
        horzLine: { color: c.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: resolvedBg },
      },
      rightPriceScale: {
        borderColor: c.scaleBorder,
        scaleMargins: { top: 0.06, bottom: mainBottom },
        entireTextOnly: true,
        mode: logScale ? 1 : 0,
      },
      timeScale: {
        borderColor: c.scaleBorder,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      width: el.clientWidth,
      height: el.clientHeight,
    });
    chartRef.current = chart;

    // ── Main price series ────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mainSeries: ISeriesApi<any>;

    if (chartType === "Bar") {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: c.buy, downColor: c.sell,
      });
    } else if (chartType === "Line") {
      mainSeries = chart.addSeries(LineSeries, {
        color: c.primary, lineWidth: 2,
      });
    } else if (chartType === "Area") {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: c.primary,
        topColor: c.primary + "38",
        bottomColor: c.primary + "08",
        lineWidth: 2,
      });
    } else if (chartType === "Baseline") {
      const basePrice = candleData.length > 0 ? candleData[0].open : 0;
      mainSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: "price" as const, price: basePrice },
        topLineColor: c.buy,
        topFillColor1: c.buy + "28",
        topFillColor2: c.buy + "05",
        bottomLineColor: c.sell,
        bottomFillColor1: c.sell + "05",
        bottomFillColor2: c.sell + "28",
      });
    } else {
      // Default: Candlestick
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: c.buy, downColor: c.sell,
        borderDownColor: c.sell, borderUpColor: c.buy,
        wickDownColor: c.sell + "CC", wickUpColor: c.buy + "CC",
      });
    }
    mainSeriesRef.current = mainSeries;

    // ── Volume histogram ─────────────────────────────────────────────────
    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volRef.current = vol;

    // ── Indicator overlay series ─────────────────────────────────────────
    const indSeries: typeof indicatorSeriesRef.current = [];

    // SMA
    if (indicatorData?.sma) {
      const s = chart.addSeries(LineSeries, {
        color: IND_COLORS.sma, lineWidth: 1, priceScaleId: "right",
      });
      s.setData(indicatorData.sma.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      indSeries.push(s);
    }
    // EMA
    if (indicatorData?.ema) {
      const s = chart.addSeries(LineSeries, {
        color: IND_COLORS.ema, lineWidth: 1, priceScaleId: "right",
      });
      s.setData(indicatorData.ema.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      indSeries.push(s);
    }
    // Bollinger Bands
    if (indicatorData?.bb) {
      for (const [data, color] of [
        [indicatorData.bb.upper, IND_COLORS.bbUpper],
        [indicatorData.bb.middle, IND_COLORS.bbMiddle],
        [indicatorData.bb.lower, IND_COLORS.bbLower],
      ] as const) {
        const s = chart.addSeries(LineSeries, {
          color: color as string, lineWidth: 1, priceScaleId: "right",
        });
        s.setData((data as { time: number; value: number }[]).map((d) => ({ time: d.time as unknown as string, value: d.value })));
        indSeries.push(s);
      }
    }
    // VWAP
    if (indicatorData?.vwap) {
      const s = chart.addSeries(LineSeries, {
        color: IND_COLORS.vwap, lineWidth: 1, lineStyle: LineStyle.Dashed, priceScaleId: "right",
      });
      s.setData(indicatorData.vwap.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      indSeries.push(s);
    }

    // RSI (separate bottom pane via overlay scale)
    if (indicatorData?.rsi) {
      const rsiTopMargin = indicatorData.bottomPaneCount > 1 ? 0.65 : 0.68;
      const s = chart.addSeries(LineSeries, {
        color: IND_COLORS.rsi, lineWidth: 2, priceScaleId: "rsi",
        lastValueVisible: true, priceLineVisible: false,
      });
      s.priceScale().applyOptions({
        scaleMargins: { top: rsiTopMargin, bottom: indicatorData.bottomPaneCount > 1 ? 0.2 : 0.04 },
      });
      s.setData(indicatorData.rsi.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      indSeries.push(s);
    }
    // MACD (separate bottom pane)
    if (indicatorData?.macd) {
      const macdTop = indicatorData.bottomPaneCount > 1 ? 0.82 : 0.68;
      // MACD line
      const ml = chart.addSeries(LineSeries, {
        color: IND_COLORS.macdLine, lineWidth: 2, priceScaleId: "macd",
        lastValueVisible: true, priceLineVisible: false,
      });
      ml.priceScale().applyOptions({ scaleMargins: { top: macdTop, bottom: 0.04 } });
      ml.setData(indicatorData.macd.macd.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      indSeries.push(ml);
      // Signal line
      const sl = chart.addSeries(LineSeries, {
        color: IND_COLORS.macdSignal, lineWidth: 1, priceScaleId: "macd",
        lastValueVisible: false, priceLineVisible: false,
      });
      sl.setData(indicatorData.macd.signal.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      indSeries.push(sl);
      // Histogram
      const mh = chart.addSeries(HistogramSeries, {
        priceScaleId: "macd", priceLineVisible: false, lastValueVisible: false,
      });
      mh.setData(indicatorData.macd.histogram.map((d) => ({
        time: d.time as unknown as string,
        value: d.value,
        color: d.value >= 0 ? IND_COLORS.macdHistUp : IND_COLORS.macdHistDn,
      })));
      indSeries.push(mh);
    }
    indicatorSeriesRef.current = indSeries;

    // ── Set main data ────────────────────────────────────────────────────
    if (candleData.length > 0) {
      const usesOHLC = chartType === "Candlestick" || chartType === "Bar";
      if (usesOHLC) {
        mainSeries.setData(candleData.map((d) => ({
          time: d.time as unknown as string, open: d.open, high: d.high, low: d.low, close: d.close,
        })));
      } else {
        mainSeries.setData(candleData.map((d) => ({
          time: d.time as unknown as string, value: d.close,
        })));
      }
      vol.setData(candleData.map((d) => ({
        time: d.time as unknown as string, value: d.volume,
        color: d.close >= d.open ? c.buy + "30" : c.sell + "30",
      })));
      chart.timeScale().fitContent();
    }
    prevDataKeyRef.current = `${candleData[0]?.time ?? 0}:${candleData.length}`;

    // ── Drawing overlay renderer ────────────────────────────────────────
    const redrawOverlay = () => {
      const cvs = overlayCanvasRef.current;
      if (!cvs || !mainSeriesRef.current || !chartRef.current) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      const conv = makeConverter(chartRef.current, mainSeriesRef.current);
      const tool = drawingToolRef.current;
      // Combine completed + in-progress (pending + cursor) drawings
      const all = [...drawingsRef.current];
      if (pendingPointsRef.current.length > 0 && isDrawingTool(tool)) {
        const pts = [...pendingPointsRef.current];
        if (cursorPosRef.current) pts.push(cursorPosRef.current);
        if (pts.length > 0) {
          all.push(createDrawing(tool, pts, "#FFFFFF80", 1));
        }
      }
      renderDrawings(ctx, all, conv, cvs.width, cvs.height);
      // Render selection handles for selected drawing
      const selId = selectedIdRef.current;
      if (selId) {
        const selDraw = drawingsRef.current.find(d => d.id === selId);
        if (selDraw) renderSelectionHandles(ctx, selDraw, conv);
      }
    };

    // Helper to notify parent of drawing changes
    const notifyChange = () => {
      onDrawingsChangeRef.current?.(drawingsRef.current.slice());
    };

    // ── Click handler — handles placement, selection, and drag ───────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clickHandler = (param: any) => {
      if (!param.point) return;
      const tool = drawingToolRef.current;

      try {
        const price = mainSeries.coordinateToPrice(param.point.y);
        const time = chart.timeScale().coordinateToTime(param.point.x);
        if (price == null || !isFinite(price) || time == null) return;
        const pt: DrawingPoint = { time: time as unknown as number, price };

        // ─ If in cursor mode: handle selection and drag-drop ─
        if (tool === "cursor" || tool === "crosshair") {
          // If dragging — drop the drawing at new position
          if (dragStartRef.current && selectedIdRef.current) {
            const timeDelta = pt.time - dragStartRef.current.time;
            const priceDelta = pt.price - dragStartRef.current.price;
            const idx = drawingsRef.current.findIndex(d => d.id === selectedIdRef.current);
            if (idx >= 0) {
              drawingsRef.current[idx] = moveDrawing(drawingsRef.current[idx], timeDelta, priceDelta);
              notifyChange();
            }
            dragStartRef.current = null;
            redrawOverlay();
            return;
          }

          // Hit-test for selection
          const conv = makeConverter(chart, mainSeries);
          let found: string | null = null;
          for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
            if (hitTestDrawing(drawingsRef.current[i], param.point.x, param.point.y, conv)) {
              found = drawingsRef.current[i].id;
              break;
            }
          }
          if (found) {
            selectedIdRef.current = found;
            dragStartRef.current = pt; // start potential drag
          } else {
            selectedIdRef.current = null;
            dragStartRef.current = null;
          }
          redrawOverlay();
          return;
        }

        // ─ Drawing tool active: place points ─
        if (!isDrawingTool(tool)) return;

        // Special case: hline uses native price lines
        if (tool === "hline") {
          const pl = mainSeries.createPriceLine({
            price, color: "#FFFFFFCC", lineWidth: 1,
            lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "",
          });
          hlinePriceLines.current.push(pl);
          // Also store as a drawing for persistence
          const d = createDrawing("hline", [pt], "#FFFFFFCC", 1);
          drawingsRef.current.push(d);
          notifyChange();
          redrawOverlay();
          return;
        }

        const needed = TOOL_POINTS[tool] ?? 0;
        pendingPointsRef.current.push(pt);

        if (pendingPointsRef.current.length >= needed) {
          const d = createDrawing(tool, [...pendingPointsRef.current], "#FFFFFFCC", 1);
          if (tool === "text" || tool === "note" || tool === "anchored_note" || tool === "callout") {
            d.text = prompt("Enter text:") || "Text";
          }
          drawingsRef.current.push(d);
          pendingPointsRef.current = [];
          notifyChange();
        }
        redrawOverlay();
      } catch { /* ignore */ }
    };
    chart.subscribeClick(clickHandler);

    // ── Crosshair move — preview in-progress drawing + drag update ────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveHandler = (param: any) => {
      if (!param.point) return;
      const tool = drawingToolRef.current;

      // In-progress drawing preview
      if (isDrawingTool(tool) && pendingPointsRef.current.length > 0) {
        try {
          const price = mainSeries.coordinateToPrice(param.point.y);
          const time = chart.timeScale().coordinateToTime(param.point.x);
          if (price == null || !isFinite(price) || time == null) return;
          cursorPosRef.current = { time: time as unknown as number, price };
          redrawOverlay();
        } catch { /* ignore */ }
        return;
      }

      // Drag preview (move drawing as cursor moves)
      if (dragStartRef.current && selectedIdRef.current && (tool === "cursor" || tool === "crosshair")) {
        try {
          const price = mainSeries.coordinateToPrice(param.point.y);
          const time = chart.timeScale().coordinateToTime(param.point.x);
          if (price == null || !isFinite(price) || time == null) return;
          // Update drag target for real-time preview
          const timeDelta = (time as unknown as number) - dragStartRef.current.time;
          const priceDelta = price - dragStartRef.current.price;
          const idx = drawingsRef.current.findIndex(d => d.id === selectedIdRef.current);
          if (idx >= 0) {
            drawingsRef.current[idx] = moveDrawing(drawingsRef.current[idx], timeDelta, priceDelta);
            dragStartRef.current = { time: time as unknown as number, price };
          }
          redrawOverlay();
        } catch { /* ignore */ }
        return;
      }

      // Clear cursor pos if not in drawing mode
      if (cursorPosRef.current) { cursorPosRef.current = null; redrawOverlay(); }
    };
    chart.subscribeCrosshairMove(moveHandler);

    // ── Re-render drawings when chart scrolls/zooms ──────────────────────
    const rangeHandler = () => redrawOverlay();
    chart.timeScale().subscribeVisibleTimeRangeChange(rangeHandler);

    // ── Resize observer ──────────────────────────────────────────────────
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
        const cvs = overlayCanvasRef.current;
        if (cvs) {
          cvs.width = width;
          cvs.height = height;
          redrawOverlay();
        }
      }
    });
    ro.observe(el);

    // Initial overlay size sync
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      canvas.width = el.clientWidth;
      canvas.height = el.clientHeight;
      redrawOverlay();
    }

    return () => {
      chart.unsubscribeClick(clickHandler);
      chart.unsubscribeCrosshairMove(moveHandler);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(rangeHandler);
      ro.disconnect();
      overlayLinesRef.current = [];
      currentPriceLineRef.current = null;
      hlinePriceLines.current = [];
      indicatorSeriesRef.current = [];
      mainSeriesRef.current = null;
      volRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, chartType, indicatorsKey, logScale]);

  // ── Effect 2 — Incremental data update (new candle ticks) ─────────────────
  useEffect(() => {
    const series = mainSeriesRef.current;
    const volSeries = volRef.current;
    const chart = chartRef.current;
    if (!series || !volSeries || !chart || candleData.length === 0) return;

    const c = getColors();
    const key = `${candleData[0]?.time ?? 0}:${candleData.length}`;

    // Skip if data hasn't changed from what Effect 1 already set
    if (key === prevDataKeyRef.current) return;

    const firstTime = candleData[0]?.time ?? 0;
    const prevParts = prevDataKeyRef.current.split(":");
    const prevFirst = Number(prevParts[0] || 0);
    const prevLen = Number(prevParts[1] || 0);
    const isNewFetch = prevFirst !== firstTime || Math.abs(candleData.length - prevLen) > 5;

    const usesOHLC = chartType === "Candlestick" || chartType === "Bar";

    if (isNewFetch) {
      if (usesOHLC) {
        series.setData(candleData.map((d) => ({
          time: d.time as unknown as string, open: d.open, high: d.high, low: d.low, close: d.close,
        })));
      } else {
        series.setData(candleData.map((d) => ({
          time: d.time as unknown as string, value: d.close,
        })));
      }
      volSeries.setData(candleData.map((d) => ({
        time: d.time as unknown as string, value: d.volume,
        color: d.close >= d.open ? c.buy + "30" : c.sell + "30",
      })));
      chart.timeScale().fitContent();
    } else {
      const last = candleData[candleData.length - 1];
      if (last) {
        try {
          if (usesOHLC) {
            series.update({ time: last.time as unknown as string, open: last.open, high: last.high, low: last.low, close: last.close });
          } else {
            series.update({ time: last.time as unknown as string, value: last.close });
          }
          volSeries.update({
            time: last.time as unknown as string, value: last.volume,
            color: last.close >= last.open ? c.buy + "30" : c.sell + "30",
          });
        } catch { /* series not ready */ }
      }
    }
    prevDataKeyRef.current = key;
  }, [candleData, getColors, chartType]);

  // ── Effect 3 — Current price line ─────────────────────────────────────────
  useEffect(() => {
    const series = mainSeriesRef.current;
    if (!series || !currentPrice || currentPrice <= 0 || candleData.length === 0) return;
    const c = getColors();
    const last = candleData[candleData.length - 1];
    const isUp = last ? currentPrice >= last.open : true;
    try {
      if (currentPriceLineRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        series.removePriceLine(currentPriceLineRef.current as any);
      }
      currentPriceLineRef.current = series.createPriceLine({
        price: currentPrice, color: isUp ? c.buy : c.sell,
        lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: "",
      });
    } catch { /* ignore */ }
  }, [currentPrice, getColors, candleData]);

  // ── Effect 4 — Order & position overlays ──────────────────────────────────
  useEffect(() => {
    const series = mainSeriesRef.current;
    if (!series) return;
    const c = getColors();

    for (const line of overlayLinesRef.current) {
      try { series.removePriceLine(line); } catch { /* ignore */ }
    }
    overlayLinesRef.current = [];

    if (!showOrderLines) return;

    for (const order of orders.filter((o) => o.status === "open")) {
      const isBuy = order.side === "buy";
      if (order.price > 0) {
        overlayLinesRef.current.push(series.createPriceLine({
          price: order.price, color: isBuy ? c.buy : c.sell,
          lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true,
          title: `${isBuy ? "BUY" : "SELL"} ${order.price.toLocaleString()}`,
        }));
      }
      if (order.tp && order.tp > 0) {
        overlayLinesRef.current.push(series.createPriceLine({
          price: order.tp, color: c.buyBright, lineWidth: 1,
          lineStyle: LineStyle.LargeDashed, axisLabelVisible: true, title: `TP ${order.tp.toLocaleString()}`,
        }));
      }
      if (order.sl && order.sl > 0) {
        overlayLinesRef.current.push(series.createPriceLine({
          price: order.sl, color: c.sellBright, lineWidth: 1,
          lineStyle: LineStyle.LargeDashed, axisLabelVisible: true, title: `SL ${order.sl.toLocaleString()}`,
        }));
      }
    }

    for (const pos of positions) {
      const isLong = pos.side === "long";
      if (pos.entryPrice > 0) {
        overlayLinesRef.current.push(series.createPriceLine({
          price: pos.entryPrice, color: isLong ? c.buy : c.sell, lineWidth: 2,
          lineStyle: LineStyle.Solid, axisLabelVisible: true,
          title: `${isLong ? "LONG" : "SHORT"} Entry${pos.quantity > 0 ? ` $${pos.quantity.toFixed(0)}` : ""}`,
        }));
      }
      if (pos.liquidationPrice > 0) {
        overlayLinesRef.current.push(series.createPriceLine({
          price: pos.liquidationPrice, color: c.liq, lineWidth: 2,
          lineStyle: LineStyle.SparseDotted, axisLabelVisible: true,
          title: `LIQ ${pos.liquidationPrice.toFixed(2)}`,
        }));
      }
    }
  }, [orders, positions, showOrderLines, getColors]);

  // ── Effect 5 — Update crosshair mode when drawingTool changes ───────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      crosshair: { mode: drawingTool === "crosshair" ? 1 : 0 },
    });
  }, [drawingTool]);

  // ── Effect 6 — Erase all drawings when tool is erase_all ────────────────
  useEffect(() => {
    if (drawingTool !== "erase_all") return;
    drawingsRef.current = [];
    pendingPointsRef.current = [];
    cursorPosRef.current = null;
    selectedIdRef.current = null;
    dragStartRef.current = null;
    const series = mainSeriesRef.current;
    if (series) {
      for (const pl of hlinePriceLines.current) {
        try { series.removePriceLine(pl); } catch { /* ignore */ }
      }
    }
    hlinePriceLines.current = [];
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onDrawingsChangeRef.current?.([]);
    onClearDrawings?.();
  }, [drawingTool, onClearDrawings]);

  // Reset pending points when tool changes
  useEffect(() => {
    pendingPointsRef.current = [];
    cursorPosRef.current = null;
  }, [drawingTool]);

  // ── Effect 7 — Keyboard: Delete/Backspace removes selected drawing ─────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIdRef.current) {
        // Don't delete if user is typing in an input
        if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
        drawingsRef.current = drawingsRef.current.filter(d => d.id !== selectedIdRef.current);
        selectedIdRef.current = null;
        dragStartRef.current = null;
        onDrawingsChangeRef.current?.(drawingsRef.current.slice());
        // Re-render overlay
        const canvas = overlayCanvasRef.current;
        if (canvas && mainSeriesRef.current && chartRef.current) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const conv = makeConverter(chartRef.current, mainSeriesRef.current);
            renderDrawings(ctx, drawingsRef.current, conv, canvas.width, canvas.height);
          }
        }
        e.preventDefault();
      }
      // Escape deselects
      if (e.key === "Escape") {
        selectedIdRef.current = null;
        dragStartRef.current = null;
        pendingPointsRef.current = [];
        const canvas = overlayCanvasRef.current;
        if (canvas && mainSeriesRef.current && chartRef.current) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const conv = makeConverter(chartRef.current, mainSeriesRef.current);
            renderDrawings(ctx, drawingsRef.current, conv, canvas.width, canvas.height);
          }
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {/* Transparent canvas overlay for drawings (trend lines, shapes, etc.) */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--surface-container-lowest)", opacity: 0.8, zIndex: 3 }}>
          <div className="text-[12px]" style={{ color: "var(--on-surface-muted)" }}>Loading chart data...</div>
        </div>
      )}
    </div>
  );
}

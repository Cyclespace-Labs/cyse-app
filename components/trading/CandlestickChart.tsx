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
  onClearDrawings?: () => void;
}

/** Read a CSS variable from :root. */
function css(v: string, fb: string): string {
  if (typeof window === "undefined") return fb;
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;
}

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
  const drawingsRef = useRef<Drawing[]>([]);
  const pendingPointsRef = useRef<DrawingPoint[]>([]);
  const cursorPosRef = useRef<DrawingPoint | null>(null);
  const { theme } = useTheme();

  const indicatorsKey = indicators.slice().sort().join(",");

  const getColors = useCallback(() => ({
    bg:          css("--surface-container-lowest", theme === "light" ? "#ffffff" : "#0c0f14"),
    text:        css("--on-surface-disabled",      theme === "light" ? "#9a9daa" : "#5a5d70"),
    grid:        css("--outline-variant",          theme === "light" ? "#d0d4e0" : "#424654") + "26",
    crosshair:   css("--on-surface-muted",         theme === "light" ? "#5a5d70" : "#8a8da0"),
    scaleBorder: css("--outline-variant",          theme === "light" ? "#d0d4e0" : "#424654") + "40",
    buy:         css("--buy",                      theme === "light" ? "#00a866" : "#00c076"),
    buyBright:   css("--buy-bright",               theme === "light" ? "#00c076" : "#00d884"),
    sell:        css("--sell",                      theme === "light" ? "#e53935" : "#ff4d4f"),
    sellBright:  css("--sell-bright",               theme === "light" ? "#ff5252" : "#ff6b6d"),
    liq:         css("--liquidation",              "#ff6b35"),
    warning:     css("--warning",                  "#ffb68f"),
    primary:     css("--primary",                  "#0E76FD"),
  }), [theme]);

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
    const hasBottomPane = indicatorData ? indicatorData.bottomPaneCount > 0 : false;
    const mainBottom = hasBottomPane ? 0.38 : 0.22;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: c.bg },
        textColor: c.text,
        fontSize: 11,
        fontFamily: "'Alexandria', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: c.grid, style: LineStyle.Dotted },
        horzLines: { color: c.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: drawingTool === "crosshair" ? 1 : 0,
        vertLine: { color: c.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: c.bg },
        horzLine: { color: c.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: c.bg },
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
      const canvas = overlayCanvasRef.current;
      if (!canvas || !mainSeriesRef.current || !chartRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const conv = makeConverter(chartRef.current, mainSeriesRef.current);
      // Combine completed + in-progress (pending + cursor) drawings
      const all = [...drawingsRef.current];
      if (pendingPointsRef.current.length > 0 && isDrawingTool(drawingTool)) {
        const pts = [...pendingPointsRef.current];
        if (cursorPosRef.current) pts.push(cursorPosRef.current);
        if (pts.length > 0) {
          all.push(createDrawing(drawingTool, pts, "#FFFFFF80", 1));
        }
      }
      renderDrawings(ctx, all, conv, canvas.width, canvas.height);
    };

    // ── Click handler for all drawing tools ──────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clickHandler = (param: any) => {
      if (!param.point || !isDrawingTool(drawingTool)) return;
      try {
        const price = mainSeries.coordinateToPrice(param.point.y);
        const time = chart.timeScale().coordinateToTime(param.point.x);
        if (price == null || !isFinite(price) || time == null) return;

        const pt: DrawingPoint = { time: time as unknown as number, price };

        // Special case: hline uses native price lines for crisp rendering
        if (drawingTool === "hline") {
          const pl = mainSeries.createPriceLine({
            price, color: "#FFFFFFCC", lineWidth: 1,
            lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "",
          });
          hlinePriceLines.current.push(pl);
          return;
        }

        const needed = TOOL_POINTS[drawingTool] ?? 0;
        pendingPointsRef.current.push(pt);

        if (pendingPointsRef.current.length >= needed) {
          // Complete the drawing
          const d = createDrawing(drawingTool, [...pendingPointsRef.current], "#FFFFFFCC", 1);
          // For text/note tools, prompt for text
          if (drawingTool === "text" || drawingTool === "note" || drawingTool === "anchored_note" || drawingTool === "callout") {
            d.text = prompt("Enter text:") || "Text";
          }
          drawingsRef.current.push(d);
          pendingPointsRef.current = [];
        }
        redrawOverlay();
      } catch { /* ignore */ }
    };
    chart.subscribeClick(clickHandler);

    // ── Crosshair move for in-progress drawing preview ───────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveHandler = (param: any) => {
      if (!param.point || !isDrawingTool(drawingTool) || pendingPointsRef.current.length === 0) {
        if (cursorPosRef.current) { cursorPosRef.current = null; redrawOverlay(); }
        return;
      }
      try {
        const price = mainSeries.coordinateToPrice(param.point.y);
        const time = chart.timeScale().coordinateToTime(param.point.x);
        if (price == null || !isFinite(price) || time == null) return;
        cursorPosRef.current = { time: time as unknown as number, price };
        redrawOverlay();
      } catch { /* ignore */ }
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
        // Sync overlay canvas size
        const canvas = overlayCanvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
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
  }, [theme, chartType, indicatorsKey, logScale, drawingTool]);

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

  // ── Effect 5 — Erase all drawings when tool is erase_all ────────────────
  useEffect(() => {
    if (drawingTool !== "erase_all") return;
    // Clear canvas drawings
    drawingsRef.current = [];
    pendingPointsRef.current = [];
    cursorPosRef.current = null;
    // Clear hline price lines
    const series = mainSeriesRef.current;
    if (series) {
      for (const pl of hlinePriceLines.current) {
        try { series.removePriceLine(pl); } catch { /* ignore */ }
      }
    }
    hlinePriceLines.current = [];
    // Redraw (clear) overlay
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClearDrawings?.();
  }, [drawingTool, onClearDrawings]);

  // Reset pending points when tool changes
  useEffect(() => {
    pendingPointsRef.current = [];
    cursorPosRef.current = null;
  }, [drawingTool]);

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

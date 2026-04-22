"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineStyle,
} from "lightweight-charts";
import { Order, Position } from "@/types/trading";
import { useTheme } from "@/contexts/ThemeContext";
import type { Candle } from "@/hooks/useCandleData";

interface CandlestickChartProps {
  candles: Candle[];
  orders?: Order[];
  positions?: Position[];
  currentPrice?: number;
  loading?: boolean;
}

/** Read a CSS variable value from :root. */
function css(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

export default function CandlestickChart({
  candles: candleData,
  orders = [],
  positions = [],
  currentPrice,
  loading,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceLinesRef = useRef<any[]>([]);
  const currentPriceLineRef = useRef<unknown>(null);
  const prevCandleLenRef = useRef(0);
  const { theme } = useTheme();

  // ── Read live CSS variables so colours perfectly match the design system ──
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

  // ── Effect 1 — Create chart once (re-runs on theme change only) ───────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const c = getColors();

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
        mode: 0,
        vertLine: { color: c.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: c.bg },
        horzLine: { color: c.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: c.bg },
      },
      rightPriceScale: {
        borderColor: c.scaleBorder,
        scaleMargins: { top: 0.08, bottom: 0.22 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: c.scaleBorder,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      width: el.clientWidth,
      height: el.clientHeight,
    });
    chartRef.current = chart;

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: c.buy,
      downColor: c.sell,
      borderDownColor: c.sell,
      borderUpColor: c.buy,
      wickDownColor: c.sell + "CC",
      wickUpColor: c.buy + "CC",
    });
    candleRef.current = candles;

    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volRef.current = vol;

    priceLinesRef.current = [];
    currentPriceLineRef.current = null;
    prevCandleLenRef.current = 0;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      priceLinesRef.current = [];
      currentPriceLineRef.current = null;
      prevCandleLenRef.current = 0;
      candleRef.current = null;
      volRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [theme, getColors]);

  // ── Effect 2 — Set / update candle data when it changes ───────────────────
  useEffect(() => {
    const series = candleRef.current;
    const volSeries = volRef.current;
    const chart = chartRef.current;
    if (!series || !volSeries || !chart || candleData.length === 0) return;

    const c = getColors();

    // Full re-set when data length changes significantly (new fetch)
    const isNewFetch = Math.abs(candleData.length - prevCandleLenRef.current) > 5;

    if (isNewFetch) {
      const formatted = candleData.map((d) => ({
        time: d.time as unknown as string,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      const formattedVol = candleData.map((d) => ({
        time: d.time as unknown as string,
        value: d.volume,
        color: d.close >= d.open ? c.buy + "30" : c.sell + "30",
      }));

      series.setData(formatted);
      volSeries.setData(formattedVol);
      chart.timeScale().fitContent();
      prevCandleLenRef.current = candleData.length;
    } else {
      // Incremental update — update the last candle
      const last = candleData[candleData.length - 1];
      if (last) {
        try {
          series.update({
            time: last.time as unknown as string,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
          });
          volSeries.update({
            time: last.time as unknown as string,
            value: last.volume,
            color: last.close >= last.open ? c.buy + "30" : c.sell + "30",
          });
        } catch { /* series not ready */ }
      }
      prevCandleLenRef.current = candleData.length;
    }
  }, [candleData, getColors]);

  // ── Effect 3 — Current price marker line ──────────────────────────────────
  useEffect(() => {
    const series = candleRef.current;
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
        price: currentPrice,
        color: isUp ? c.buy : c.sell,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: "",
      });
    } catch { /* ignore */ }
  }, [currentPrice, getColors, candleData]);

  // ── Effect 4 — Position & order overlay lines ─────────────────────────────
  useEffect(() => {
    const series = candleRef.current;
    if (!series) return;

    const c = getColors();

    for (const line of priceLinesRef.current) {
      try { series.removePriceLine(line); } catch { /* ignore */ }
    }
    priceLinesRef.current = [];

    // ── Order lines ─────────────────────────────────────────────────────────
    for (const order of orders.filter((o) => o.status === "open")) {
      const isBuy = order.side === "buy";
      if (order.price > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: order.price,
            color: isBuy ? c.buy : c.sell,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${isBuy ? "BUY" : "SELL"} ${order.price.toLocaleString()}`,
          })
        );
      }
      if (order.tp && order.tp > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: order.tp,
            color: c.buyBright,
            lineWidth: 1,
            lineStyle: LineStyle.LargeDashed,
            axisLabelVisible: true,
            title: `TP ${order.tp.toLocaleString()}`,
          })
        );
      }
      if (order.sl && order.sl > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: order.sl,
            color: c.sellBright,
            lineWidth: 1,
            lineStyle: LineStyle.LargeDashed,
            axisLabelVisible: true,
            title: `SL ${order.sl.toLocaleString()}`,
          })
        );
      }
    }

    // ── Position lines (entry + liquidation) ────────────────────────────────
    for (const pos of positions) {
      const isLong = pos.side === "long";
      if (pos.entryPrice > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: pos.entryPrice,
            color: isLong ? c.buy : c.sell,
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `${isLong ? "LONG" : "SHORT"} Entry${pos.quantity > 0 ? ` $${pos.quantity.toFixed(0)}` : ""}`,
          })
        );
      }
      if (pos.liquidationPrice > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: pos.liquidationPrice,
            color: c.liq,
            lineWidth: 2,
            lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true,
            title: `LIQ ${pos.liquidationPrice.toFixed(2)}`,
          })
        );
      }
    }
  }, [orders, positions, getColors]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--surface-container-lowest)", opacity: 0.8 }}>
          <div className="text-[12px]" style={{ color: "var(--on-surface-muted)" }}>Loading chart data...</div>
        </div>
      )}
    </div>
  );
}

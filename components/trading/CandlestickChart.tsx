"use client";

import { useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, IChartApi, ISeriesApi } from "lightweight-charts";
import { generateCandlestickDataForToken } from "@/lib/tradingData";
import { Order, Position } from "@/types/trading";
import { useTheme } from "@/contexts/ThemeContext";

interface LiveCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
  currentPrice?: number;
}

export default function CandlestickChart({
  symbol = "SOL",
  orders = [],
  positions = [],
  currentPrice,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceLinesRef = useRef<any[]>([]);
  const latestCandleRef = useRef<LiveCandle | null>(null);
  const { theme } = useTheme();

  const getThemeColors = useCallback(() => {
    if (theme === "light") {
      return {
        background: "#ffffff",
        textColor: "#9a9daa",
        gridColor: "#DEDEDE",
        crosshairColor: "#5a5d70",
        buy: "#00a866",
        sell: "#e53935",
        liquidation: "#ff6b35",
      };
    }
    return {
      background: "#0c0f14",
      textColor: "#5a5d70",
      gridColor: "#1C232C",
      crosshairColor: "#8a8da0",
      buy: "#00c076",
      sell: "#ff4d4f",
      liquidation: "#ff6b35",
    };
  }, [theme]);

  // Effect 1 — Chart init: only re-runs on symbol or theme change
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getThemeColors();
    const tokenData = generateCandlestickDataForToken(symbol);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: colors.crosshairColor, width: 1, style: 2 },
        horzLine: { color: colors.crosshairColor, width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: colors.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.buy,
      downColor: colors.sell,
      borderDownColor: colors.sell,
      borderUpColor: colors.buy,
      wickDownColor: colors.sell,
      wickUpColor: colors.buy,
    });

    candleSeriesRef.current = candleSeries;
    priceLinesRef.current = [];

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const formattedCandles = tokenData.map((d) => ({
      time: (new Date(d.time).getTime() / 1000) as unknown as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const formattedVolume = tokenData.map((d) => ({
      time: (new Date(d.time).getTime() / 1000) as unknown as string,
      value: d.volume,
      color: d.close >= d.open ? `${colors.buy}4D` : `${colors.sell}4D`,
    }));

    candleSeries.setData(formattedCandles);
    volumeSeries.setData(formattedVolume);

    // Store last candle for live updates
    const last = tokenData[tokenData.length - 1];
    if (last) {
      latestCandleRef.current = {
        time: new Date(last.time).getTime() / 1000,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
      };
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      priceLinesRef.current = [];
      latestCandleRef.current = null;
      candleSeriesRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, theme, getThemeColors]);

  // Effect 2 — Live price: update the latest candle close in real time
  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice || currentPrice <= 0) return;
    const latest = latestCandleRef.current;
    if (!latest) return;

    const updated = {
      time: latest.time as unknown as string,
      open: latest.open,
      high: Math.max(latest.high, currentPrice),
      low: Math.min(latest.low, currentPrice),
      close: currentPrice,
    };

    try {
      candleSeriesRef.current.update(updated);
      latestCandleRef.current = {
        ...latest,
        high: updated.high,
        low: updated.low,
        close: currentPrice,
      };
    } catch {
      // Chart may have been destroyed between renders
    }
  }, [currentPrice]);

  // Effect 3 — Overlay lines: positions and orders (no chart rebuild)
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    const colors = getThemeColors();

    // Remove existing price lines
    for (const line of priceLinesRef.current) {
      try { series.removePriceLine(line); } catch { /* ignore */ }
    }
    priceLinesRef.current = [];

    // Order lines
    for (const order of orders.filter((o) => o.status === "open")) {
      if (order.price > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: order.price,
            color: order.side === "buy" ? colors.buy : colors.sell,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `${order.side === "buy" ? "BUY" : "SELL"} @ ${order.price}`,
          })
        );
      }
      if (order.tp) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: order.tp,
            color: colors.buy,
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: `TP ${order.tp}`,
          })
        );
      }
      if (order.sl) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: order.sl,
            color: colors.sell,
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: `SL ${order.sl}`,
          })
        );
      }
    }

    // Position entry + liquidation lines
    for (const pos of positions) {
      if (pos.entryPrice > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: pos.entryPrice,
            color: pos.side === "long" ? colors.buy : colors.sell,
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `${pos.side === "long" ? "LONG" : "SHORT"} ${pos.quantity > 0 ? `$${pos.quantity.toFixed(0)}` : ""}`,
          })
        );
      }
      if (pos.liquidationPrice > 0) {
        priceLinesRef.current.push(
          series.createPriceLine({
            price: pos.liquidationPrice,
            color: colors.liquidation,
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: `LIQ ${pos.liquidationPrice.toFixed(2)}`,
          })
        );
      }
    }
  }, [orders, positions, getThemeColors]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

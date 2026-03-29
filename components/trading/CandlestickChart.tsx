"use client";

import { useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, IChartApi } from "lightweight-charts";
import { generateCandlestickDataForToken } from "@/lib/tradingData";
import { Order, Position } from "@/types/trading";
import { useTheme } from "@/contexts/ThemeContext";

interface CandlestickChartProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
}

export default function CandlestickChart({ symbol = "SOL", orders = [], positions = [] }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();

  const getThemeColors = useCallback(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return {
      background: style.getPropertyValue("--surface-container-lowest").trim() || "#0c0f14",
      textColor: style.getPropertyValue("--on-surface-disabled").trim() || "#5a5d70",
      gridColor: style.getPropertyValue("--outline-variant").trim() || "#424654",
      crosshairColor: style.getPropertyValue("--on-surface-muted").trim() || "#8a8da0",
      buy: style.getPropertyValue("--buy").trim() || "#00c076",
      sell: style.getPropertyValue("--sell").trim() || "#ff4d4f",
    };
  }, []);

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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

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

    // Render limit order lines
    const openOrders = orders.filter((o) => o.status === "open");
    for (const order of openOrders) {
      candleSeries.createPriceLine({
        price: order.price,
        color: order.side === "buy" ? colors.buy : colors.sell,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${order.side === "buy" ? "BUY" : "SELL"} ${order.quantity} @ ${order.price}`,
      });

      if (order.tp) {
        candleSeries.createPriceLine({
          price: order.tp,
          color: colors.buy,
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `TP ${order.tp}`,
        });
      }
      if (order.sl) {
        candleSeries.createPriceLine({
          price: order.sl,
          color: colors.sell,
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `SL ${order.sl}`,
        });
      }
    }

    // Render position entry lines
    const liquidationColor = getComputedStyle(document.documentElement).getPropertyValue("--liquidation").trim() || "#ff6b35";
    for (const pos of positions) {
      candleSeries.createPriceLine({
        price: pos.entryPrice,
        color: pos.side === "long" ? colors.buy : colors.sell,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${pos.side === "long" ? "LONG" : "SHORT"} Entry ${pos.entryPrice}`,
      });

      candleSeries.createPriceLine({
        price: pos.liquidationPrice,
        color: liquidationColor,
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: `LIQ ${pos.liquidationPrice}`,
      });
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
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, orders, positions, theme, getThemeColors]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

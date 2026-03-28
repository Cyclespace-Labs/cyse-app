"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { generateCandlestickDataForToken } from "@/lib/tradingData";
import { Order, Position } from "@/types/trading";

interface CandlestickChartProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
}

export default function CandlestickChart({ symbol = "SOL", orders = [], positions = [] }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const tokenData = generateCandlestickDataForToken(symbol);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0b0e" },
        textColor: "#5a5a6a",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1c1c28" },
        horzLines: { color: "#1c1c28" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#3a3a4a", width: 1, style: 2 },
        horzLine: { color: "#3a3a4a", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#1c1c28",
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "#1c1c28",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00c076",
      downColor: "#ff4d4f",
      borderDownColor: "#ff4d4f",
      borderUpColor: "#00c076",
      wickDownColor: "#ff4d4f",
      wickUpColor: "#00c076",
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
      color: d.close >= d.open ? "rgba(0, 192, 118, 0.3)" : "rgba(255, 77, 79, 0.3)",
    }));

    candleSeries.setData(formattedCandles);
    volumeSeries.setData(formattedVolume);

    // Render limit order lines
    const openOrders = orders.filter((o) => o.status === "open");
    for (const order of openOrders) {
      candleSeries.createPriceLine({
        price: order.price,
        color: order.side === "buy" ? "#00c076" : "#ff4d4f",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${order.side === "buy" ? "BUY" : "SELL"} ${order.quantity} @ ${order.price}`,
      });

      if (order.tp) {
        candleSeries.createPriceLine({
          price: order.tp,
          color: "#00c076",
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `TP ${order.tp}`,
        });
      }
      if (order.sl) {
        candleSeries.createPriceLine({
          price: order.sl,
          color: "#ff4d4f",
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `SL ${order.sl}`,
        });
      }
    }

    // Render position entry lines
    for (const pos of positions) {
      candleSeries.createPriceLine({
        price: pos.entryPrice,
        color: pos.side === "long" ? "#00c076" : "#ff4d4f",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${pos.side === "long" ? "LONG" : "SHORT"} Entry ${pos.entryPrice}`,
      });

      candleSeries.createPriceLine({
        price: pos.liquidationPrice,
        color: "#ff6b35",
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
    };
  }, [symbol, orders, positions]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

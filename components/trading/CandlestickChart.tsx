"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { candlestickData } from "@/lib/mockData";

export default function CandlestickChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

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

    const formattedCandles = candlestickData.map((d) => ({
      time: (new Date(d.time).getTime() / 1000) as unknown as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const formattedVolume = candlestickData.map((d) => ({
      time: (new Date(d.time).getTime() / 1000) as unknown as string,
      value: d.volume,
      color: d.close >= d.open ? "rgba(0, 192, 118, 0.3)" : "rgba(255, 77, 79, 0.3)",
    }));

    candleSeries.setData(formattedCandles);
    volumeSeries.setData(formattedVolume);
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
  }, []);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries, HistogramSeries } from "lightweight-charts";
import { PricePoint } from "@/types/predictions";

interface Props {
  data: PricePoint[];
  color: string;
}

export default function ProbabilityChartInner({ data, color }: Props) {
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

    const lineSeries = chart.addSeries(LineSeries, {
      color: color,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: color,
      priceLineStyle: 2,
    });

    const formattedLine = data.map((d) => ({
      time: d.time as unknown as string,
      value: d.value,
    }));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(0, 192, 118, 0.25)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const formattedVol = data
      .filter((d) => d.volume)
      .map((d) => ({
        time: d.time as unknown as string,
        value: d.volume!,
        color: "rgba(0, 192, 118, 0.2)",
      }));

    lineSeries.setData(formattedLine);
    volumeSeries.setData(formattedVol);
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

  return <div ref={chartContainerRef} className="w-full h-[300px]" />;
}

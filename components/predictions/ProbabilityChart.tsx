"use client";

import { useEffect, useRef, useState } from "react";
import { PricePoint } from "@/types/predictions";

interface ProbabilityChartProps {
  data: PricePoint[];
  color?: string;
}

const timeframes = ["5 Min", "15 Min", "1 Day"];

export default function ProbabilityChart({ data, color = "#f7931a" }: ProbabilityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [activeTimeframe, setActiveTimeframe] = useState("5 Min");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !chartContainerRef.current || data.length === 0) return;

    let cancelled = false;
    let chartInstance: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
    const container = chartContainerRef.current;

    import("lightweight-charts").then((lc) => {
      if (cancelled || !container) return;

      chartInstance = lc.createChart(container, {
        layout: {
          background: { type: lc.ColorType.Solid, color: "#0b0b0e" },
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
        width: container.clientWidth,
        height: container.clientHeight,
      });

      const lineSeries = chartInstance.addSeries(lc.LineSeries, {
        color: color,
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineColor: color,
        priceLineStyle: 2,
      });

      lineSeries.setData(
        data.map((d) => ({
          time: d.time as unknown as string,
          value: d.value,
        }))
      );

      const volumeSeries = chartInstance.addSeries(lc.HistogramSeries, {
        color: "rgba(0, 192, 118, 0.25)",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(
        data
          .filter((d) => d.volume)
          .map((d) => ({
            time: d.time as unknown as string,
            value: d.volume!,
            color: "rgba(0, 192, 118, 0.2)",
          }))
      );

      chartInstance.timeScale().fitContent();
    });

    const handleResize = () => {
      if (container && chartInstance) {
        chartInstance.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      if (chartInstance) {
        chartInstance.remove();
        chartInstance = null;
      }
    };
  }, [mounted, data, color]);

  return (
    <div className="flex flex-col bg-[#0b0b0e] border-b border-[#1c1c28]">
      {/* Timeframe Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1c1c28]">
        <span className="text-[#5a5a6a] text-[11px] font-mono mr-2">Post</span>
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              activeTimeframe === tf
                ? "text-white bg-[#1c1c28] border border-[#2a2a3a]"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full h-[300px]" />
    </div>
  );
}

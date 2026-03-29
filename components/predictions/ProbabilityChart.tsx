"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PricePoint } from "@/types/predictions";

const ChartInner = dynamic(
  () => import("./ProbabilityChartInner"),
  { ssr: false, loading: () => <div className="w-full h-[300px]" style={{ background: "var(--surface-container-lowest)" }} /> }
);

interface ProbabilityChartProps {
  data: PricePoint[];
  color?: string;
}

const timeframes = ["5 Min", "15 Min", "1 Day"];

export default function ProbabilityChart({ data, color = "#f7931a" }: ProbabilityChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState("5 Min");

  return (
    <div className="flex flex-col" style={{ background: "var(--surface-container-lowest)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Timeframe Tabs */}
      <div className="flex items-center gap-1 px-4 py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <span className="text-[11px] font-mono mr-2" style={{ color: "var(--on-surface-disabled)" }}>Post</span>
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className="px-2.5 py-1 text-[11px] font-mono rounded transition-colors"
            style={{
              color: activeTimeframe === tf ? "var(--on-surface)" : "var(--on-surface-disabled)",
              background: activeTimeframe === tf ? "var(--surface-container)" : "transparent",
              border: activeTimeframe === tf ? "1px solid rgba(66,70,84,0.6)" : "1px solid transparent",
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart - loaded client-side only */}
      <ChartInner data={data} color={color} />
    </div>
  );
}

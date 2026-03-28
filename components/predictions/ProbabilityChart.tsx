"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PricePoint } from "@/types/predictions";

const ChartInner = dynamic(
  () => import("./ProbabilityChartInner"),
  { ssr: false, loading: () => <div className="w-full h-[300px] bg-[#0b0b0e]" /> }
);

interface ProbabilityChartProps {
  data: PricePoint[];
  color?: string;
}

const timeframes = ["5 Min", "15 Min", "1 Day"];

export default function ProbabilityChart({ data, color = "#f7931a" }: ProbabilityChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState("5 Min");

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

      {/* Chart - loaded client-side only */}
      <ChartInner data={data} color={color} />
    </div>
  );
}

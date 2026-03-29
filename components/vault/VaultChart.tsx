"use client";

import { useState } from "react";
import { VaultDetail } from "@/types/vault";
import Sparkline from "./Sparkline";

interface VaultChartProps {
  vault: VaultDetail;
}

const chartViews = ["TVL", "APY", "Price"];
const timeframes = ["1D", "7D", "30D", "90D", "1Y", "All"];

export default function VaultChart({ vault }: VaultChartProps) {
  const [activeView, setActiveView] = useState("TVL");
  const [activeTimeframe, setActiveTimeframe] = useState("30D");

  const getData = () => {
    switch (activeView) {
      case "APY":
        return vault.apyHistory.map((d) => d.value);
      case "Price":
        return vault.priceHistory.map((d) => d.value);
      default:
        return vault.tvlHistory.map((d) => d.value);
    }
  };

  const data = getData();
  const currentValue = data[data.length - 1] || 0;
  const formatValue = (v: number) => {
    if (activeView === "APY") return `${v.toFixed(2)}%`;
    if (activeView === "Price") return `$${v.toFixed(4)}`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
    return `$${v.toFixed(2)}`;
  };

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c28]">
        <div className="flex items-center gap-3">
          {chartViews.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`text-[12px] font-mono transition-colors ${
                activeView === view
                  ? "text-white font-medium"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a]"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                activeTimeframe === tf
                  ? "bg-[#1c1c28] text-white"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Current Value */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-white text-[22px] font-mono font-semibold">
          {formatValue(currentValue)}
        </span>
      </div>

      {/* Chart Area */}
      <div className="px-4 py-4 flex items-end justify-center min-h-[240px]">
        <Sparkline
          data={data}
          width={680}
          height={200}
          color="#0E76FD"
        />
      </div>
    </div>
  );
}

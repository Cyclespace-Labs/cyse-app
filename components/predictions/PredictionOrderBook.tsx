"use client";

import { useState } from "react";
import { PredictionMarketDetail } from "@/types/predictions";

interface PredictionOrderBookProps {
  market: PredictionMarketDetail;
}

const tabs = ["Rules", "Market Context"];

export default function PredictionOrderBook({ market }: PredictionOrderBookProps) {
  const [activeTab, setActiveTab] = useState("Rules");

  const isHitPrice = market.options.length > 2;
  const formattedVolume = market.totalVolume
    ? `$${(market.totalVolume / 1000).toFixed(1)}K Vol.`
    : market.volume;

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c28]">
        <div className="flex items-center gap-2">
          <span className="text-white text-[13px] font-medium font-mono">Order Book</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c076]" />
        </div>
        <span className="text-[#5a5a6a] text-[11px] font-mono">{formattedVolume}</span>
      </div>

      {/* Options List - matching Polymarket screenshot layout */}
      {isHitPrice ? (
        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
          {market.options.map((option, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c28] hover:bg-[#1c1c28]/30 transition-colors group"
            >
              {/* Left: Price level + volume */}
              <div className="flex flex-col gap-0.5">
                <span
                  className={`text-[13px] font-mono font-medium ${
                    option.direction === "up" ? "text-[#00c076]" : "text-[#ff4d4f]"
                  }`}
                >
                  {option.label}
                </span>
                {option.volume && (
                  <span className="text-[#5a5a6a] text-[10px] font-mono">{option.volume}</span>
                )}
              </div>

              {/* Center: Percentage */}
              <div className="flex items-center gap-3">
                <span className="text-white text-[13px] font-mono">
                  {option.percentage < 1 ? "<1%" : `${option.percentage}%`}
                </span>
                {option.percentage > 1 && (
                  <span className="text-[#ff4d4f] text-[10px] font-mono">
                    ▼ {(option.percentage * 0.3).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Right: Buy Yes/No buttons */}
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-[11px] font-mono font-medium bg-[#00c076]/15 text-[#00c076] border border-[#00c076]/20 rounded hover:bg-[#00c076]/25 transition-colors">
                  Buy Yes {option.yesPrice !== undefined ? `${option.yesPrice}¢` : "0.2¢"}
                </button>
                <button className="px-3 py-1.5 text-[11px] font-mono font-medium bg-[#ff4d4f]/15 text-[#ff4d4f] border border-[#ff4d4f]/20 rounded hover:bg-[#ff4d4f]/25 transition-colors">
                  Buy No {option.noPrice !== undefined ? `${option.noPrice}¢` : "99.9¢"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Simple Up/Down order book */
        <div className="px-4 py-3">
          {market.options.map((option, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    option.direction === "up" ? "bg-[#00c076]" : "bg-[#ff4d4f]"
                  }`}
                />
                <span className="text-white text-[13px] font-mono font-medium">
                  {option.label}
                </span>
              </div>
              <span className="text-white text-[13px] font-mono font-semibold">
                {option.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs: Rules / Market Context */}
      <div className="border-t border-[#1c1c28]">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1c1c28]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[12px] font-mono transition-colors pb-1 ${
                activeTab === tab
                  ? "text-white border-b border-white"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 text-[11px] font-mono text-[#8a8a9a] leading-relaxed">
          {activeTab === "Rules" ? (
            <p>{market.resolutionCriteria || "This market resolves based on the official price at expiry."}</p>
          ) : (
            <p>{market.description || "No additional context available for this market."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

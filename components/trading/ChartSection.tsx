"use client";

import { useState } from "react";
import CandlestickChart from "./CandlestickChart";
import {
  Crosshair,
  Ruler,
  Type,
  Maximize2,
  RotateCcw,
  Camera,
} from "lucide-react";
import { Order, Position, TokenPriceData } from "@/types/trading";
import { formatPrice } from "@/lib/formatters";

const chartTabs = ["Chart", "Depth", "Margin", "Funding", "Market Info"];
const timeframes = ["1m", "3m", "5m", "15m", "1h", "4h", "1d"];

interface ChartSectionProps {
  symbol?: string;
  orders?: Order[];
  positions?: Position[];
  tokenPriceData?: TokenPriceData | null;
}

export default function ChartSection({ symbol = "SOL", orders = [], positions = [], tokenPriceData }: ChartSectionProps) {
  const [activeTab, setActiveTab] = useState("Chart");
  const [activeTimeframe, setActiveTimeframe] = useState("1m");

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] border-r border-[#1c1c28]">
      {/* Chart Tabs */}
      <div className="flex items-center border-b border-[#1c1c28] px-2">
        {chartTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-[12px] transition-colors ${
              activeTab === tab
                ? "text-white border-b-2 border-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tab}
          </button>
        ))}

        {/* Right side: Last / Mark / Index */}
        <div className="ml-auto flex items-center gap-1">
          {["Last", "Mark", "Index"].map((label) => (
            <button
              key={label}
              className={`px-2 py-1 text-[11px] rounded ${
                label === "Last"
                  ? "text-white bg-[#1c1c28]"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe + Tools */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1c1c28]">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              activeTimeframe === tf
                ? "text-white bg-[#1c1c28]"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tf}
          </button>
        ))}

        <div className="w-px h-4 bg-[#1c1c28] mx-1" />

        <button className="px-2 py-1 text-[11px] text-[#5a5a6a] hover:text-[#8a8a9a] rounded">
          Indicators
        </button>
        <button className="px-1.5 py-1 text-[11px] bg-yellow-500/20 text-yellow-400 rounded font-medium">
          OL
        </button>
        <button className="px-1.5 py-1 text-[11px] text-[#5a5a6a] hover:text-[#8a8a9a] rounded">
          TE
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <button className="p-1 text-[#5a5a6a] hover:text-white" title="Crosshair">
            <Crosshair size={14} />
          </button>
          <button className="p-1 text-[#5a5a6a] hover:text-white" title="Ruler">
            <Ruler size={14} />
          </button>
          <button className="p-1 text-[#5a5a6a] hover:text-white" title="Text">
            <Type size={14} />
          </button>
          <button className="p-1 text-[#5a5a6a] hover:text-white" title="Screenshot">
            <Camera size={14} />
          </button>
          <button className="p-1 text-[#5a5a6a] hover:text-white" title="Fullscreen">
            <Maximize2 size={14} />
          </button>
          <button className="px-2 py-1 text-[11px] text-[#5a5a6a] hover:text-white" title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Pair info bar */}
      <div className="flex items-center gap-2 px-3 py-1 text-[11px] text-[#5a5a6a] border-b border-[#1c1c28]">
        <span className="text-white">{symbol}-PERP · 1 · Backpack</span>
        <span className="text-[#8a8a9a]">·</span>
        {tokenPriceData && (
          <>
            <span>
              O <span className="text-white">{formatPrice(tokenPriceData.price)}</span> H{" "}
              <span className="text-white">{formatPrice(tokenPriceData.high24h)}</span> L{" "}
              <span className="text-white">{formatPrice(tokenPriceData.low24h)}</span> C{" "}
              <span className={tokenPriceData.change24h >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"}>
                {formatPrice(tokenPriceData.price)}
              </span>
            </span>
            <span className={tokenPriceData.change24h >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"}>
              {tokenPriceData.change24h >= 0 ? "+" : ""}{formatPrice(tokenPriceData.change24h)} ({tokenPriceData.changePct24h.toFixed(2)}%)
            </span>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 relative min-h-0">
        <CandlestickChart symbol={symbol} orders={orders} positions={positions} />
        {/* TradingView Watermark */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 opacity-40">
          <div className="w-5 h-5 rounded bg-[#2962FF] flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">TV</span>
          </div>
        </div>
        {/* Volume SMA label */}
        <div className="absolute bottom-16 left-3 text-[10px] text-[#5a5a6a]">
          Volume SMA <span className="text-[#8a8a9a]">11.5K</span>
        </div>
      </div>

      {/* Timerange bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[#1c1c28] text-[11px]">
        {["All", "1y", "6m", "3m", "1m", "5d", "1d"].map((range) => (
          <button
            key={range}
            className="text-[#5a5a6a] hover:text-white transition-colors"
          >
            {range}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[#5a5a6a]">
          <span>06:56:25 [UTC+2]</span>
          <span className="text-[#5a5a6a]">%</span>
          <span className="text-[#5a5a6a]">log</span>
          <span className="text-[#5a5a6a]">auto</span>
        </div>
      </div>
    </div>
  );
}

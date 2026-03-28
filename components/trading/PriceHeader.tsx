"use client";

import { priceHeaderData } from "@/lib/mockData";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { ChevronDown } from "lucide-react";

export default function PriceHeader() {
  const d = priceHeaderData;

  return (
    <div className="flex items-center gap-0 h-[52px] px-4 bg-[#0b0b0e] border-b border-[#1c1c28] overflow-x-auto">
      {/* Symbol + Leverage */}
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
          <span className="text-white text-sm font-semibold">{d.symbol}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium text-yellow-400 bg-yellow-400/10 rounded">
            {d.leverage}
          </span>
          <ChevronDown size={14} className="text-[#8a8a9a]" />
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#00c076] text-lg font-bold leading-tight">
          {formatPrice(d.price)}
        </span>
        <span className="text-[#8a8a9a] text-[11px]">{formatPrice(d.price)}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[#1c1c28] mr-4 shrink-0" />

      {/* Index Price */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">Index Price</span>
        <span className="text-white text-xs">{formatPrice(d.indexPrice)}</span>
      </div>

      {/* 24h Change */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">24h Change</span>
        <span className="text-[#ff4d4f] text-xs">
          {d.change24h.toFixed(2)} / {d.changePct24h.toFixed(2)}%
        </span>
      </div>

      {/* 1h Funding / Countdown */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">1h Funding / Countdown</span>
        <span className="text-white text-xs">
          {d.funding} / {d.countdown}
        </span>
      </div>

      {/* 24h High */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">24H High</span>
        <span className="text-white text-xs">{formatPrice(d.high24h)}</span>
      </div>

      {/* 24h Low */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">24H Low</span>
        <span className="text-white text-xs">{formatPrice(d.low24h)}</span>
      </div>

      {/* 24h Volume */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">24H Volume (USD)</span>
        <span className="text-white text-xs">{formatVolume(d.volume24h)}</span>
      </div>

      {/* Open Interest */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">Open Interest (SOL)</span>
        <span className="text-white text-xs">{formatVolume(d.openInterest)}</span>
      </div>

      {/* Profit APY */}
      <div className="flex flex-col shrink-0">
        <span className="text-[#5a5a6a] text-[10px]">Profit APY</span>
        <span className="text-[#00c076] text-xs">{d.profitApy} ↑</span>
      </div>
    </div>
  );
}

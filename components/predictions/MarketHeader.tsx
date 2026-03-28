"use client";

import { PredictionMarketDetail } from "@/types/predictions";
import CountdownTimer from "./CountdownTimer";
import Link from "next/link";
import { Share2, Bookmark, ChevronRight } from "lucide-react";

interface MarketHeaderProps {
  market: PredictionMarketDetail;
}

export default function MarketHeader({ market }: MarketHeaderProps) {
  const formattedVolume = market.totalVolume
    ? `$${(market.totalVolume).toLocaleString()} Vol.`
    : market.volume;

  return (
    <div className="px-6 py-5 border-b border-[#1c1c28] bg-[#0b0b0e]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono mb-3">
        <Link href="/predictions" className="text-[#5a5a6a] hover:text-[#00c076] transition-colors">
          Predictions
        </Link>
        <ChevronRight size={10} className="text-[#2a2a3a]" />
        <Link
          href="/predictions"
          className="text-[#5a5a6a] hover:text-[#00c076] transition-colors"
        >
          {market.category}
        </Link>
        <ChevronRight size={10} className="text-[#2a2a3a]" />
        <span className="text-[#8a8a9a]">{market.tokenSymbol}</span>
      </div>

      {/* Main Header */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: Icon + Question */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: market.iconColor }}
          >
            {market.tokenIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl font-semibold leading-snug mb-1">
              {market.question}
            </h1>
            <div className="flex items-center gap-3 text-[12px] font-mono">
              {market.status === "live" && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4f] animate-pulse" />
                  <span className="text-[#ff4d4f] font-medium">LIVE</span>
                </div>
              )}
              <span className="text-[#5a5a6a]">{formattedVolume}</span>
              {market.expiryDate && (
                <span className="text-[#5a5a6a]">
                  Expires: {new Date(market.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Countdown + Actions */}
        <div className="flex items-center gap-5 shrink-0">
          {market.expiryDate && <CountdownTimer expiryDate={market.expiryDate} />}
          <div className="flex items-center gap-1.5">
            <button
              className="p-2 text-[#5a5a6a] hover:text-white hover:bg-[#1c1c28] rounded transition-colors"
              title="Share"
            >
              <Share2 size={16} />
            </button>
            <button
              className="p-2 text-[#5a5a6a] hover:text-white hover:bg-[#1c1c28] rounded transition-colors"
              title="Bookmark"
            >
              <Bookmark size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Price Info */}
      {market.priceToHit && (
        <div className="flex items-center gap-6 mt-4 text-[13px] font-mono">
          <div className="flex flex-col">
            <span className="text-[#5a5a6a] text-[10px]">Price to beat</span>
            <span className="text-white font-semibold">
              ${market.priceToHit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5a5a6a] text-[10px]">Current price</span>
            <span className="text-[#00c076] font-semibold">
              ${(market.priceToHit * 1.0005).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

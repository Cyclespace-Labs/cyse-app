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
    <div className="px-6 py-5" style={{ background: "var(--surface-container-lowest)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono mb-3">
        <Link href="/predictions" className="transition-colors" style={{ color: "var(--on-surface-disabled)" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
          Predictions
        </Link>
        <ChevronRight size={10} style={{ color: "var(--outline-variant)" }} />
        <Link href="/predictions" className="transition-colors" style={{ color: "var(--on-surface-disabled)" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
          {market.category}
        </Link>
        <ChevronRight size={10} style={{ color: "var(--outline-variant)" }} />
        <span style={{ color: "var(--on-surface-muted)" }}>{market.tokenSymbol}</span>
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
            <h1 className="text-xl font-semibold leading-snug mb-1" style={{ color: "var(--on-surface)" }}>
              {market.question}
            </h1>
            <div className="flex items-center gap-3 text-[12px] font-mono">
              {market.status === "live" && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--sell)" }} />
                  <span className="font-medium" style={{ color: "var(--sell)" }}>LIVE</span>
                </div>
              )}
              <span style={{ color: "var(--on-surface-disabled)" }}>{formattedVolume}</span>
              {market.expiryDate && (
                <span style={{ color: "var(--on-surface-disabled)" }}>
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
              className="p-2 rounded transition-colors"
              style={{ color: "var(--on-surface-disabled)" }}
              title="Share"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Share2 size={16} />
            </button>
            <button
              className="p-2 rounded transition-colors"
              style={{ color: "var(--on-surface-disabled)" }}
              title="Bookmark"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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
            <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>Price to beat</span>
            <span className="font-semibold" style={{ color: "var(--on-surface)" }}>
              ${market.priceToHit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>Current price</span>
            <span className="font-semibold" style={{ color: "var(--buy)" }}>
              ${(market.priceToHit * 1.0005).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

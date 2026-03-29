"use client";

import Link from "next/link";
import { PredictionMarketDetail } from "@/types/predictions";

interface RelatedMarketsProps {
  markets: PredictionMarketDetail[];
}

export default function RelatedMarkets({ markets }: RelatedMarketsProps) {
  if (markets.length === 0) return null;

  return (
    <div className="space-y-2">
      {markets.slice(0, 5).map((m) => (
        <Link
          key={m.id}
          href={`/predictions/${m.id}`}
          className="flex items-center gap-3 p-3 rounded-lg transition-all group"
          style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(14,118,253,0.3)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(66,70,84,0.4)")}
        >
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: m.iconColor }}
          >
            {m.tokenIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-mono leading-snug truncate transition-colors" style={{ color: "var(--on-surface)" }}>
              {m.question}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[13px] font-mono font-semibold" style={{ color: "var(--on-surface)" }}>
              {m.options[0]?.percentage}%
            </span>
            <div className="text-[9px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              {m.options[0]?.direction === "up" ? "Up" : "Down"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

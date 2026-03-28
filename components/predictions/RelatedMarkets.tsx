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
          className="flex items-center gap-3 p-3 bg-[#0b0b0e] border border-[#1c1c28] rounded-lg hover:border-[#00c076]/30 transition-all group"
        >
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: m.iconColor }}
          >
            {m.tokenIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-mono leading-snug truncate group-hover:text-[#00c076] transition-colors">
              {m.question}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-white text-[13px] font-mono font-semibold">
              {m.options[0]?.percentage}%
            </span>
            <div className="text-[#5a5a6a] text-[9px] font-mono">
              {m.options[0]?.direction === "up" ? "Up" : "Down"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

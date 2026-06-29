"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PredictionMarket } from "@/types/predictions";
import { Bookmark, ShoppingCart } from "lucide-react";

interface PredictionCardProps {
  market: PredictionMarket;
}

export default function PredictionCard({ market }: PredictionCardProps) {
  const router = useRouter();
  const isUpDown = market.options[0]?.label === "Up" || market.options[0]?.label === "Down";

  const handleOptionClick = (e: React.MouseEvent, optionIndex: number, side: "buy" | "sell") => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/predictions/${market.id}?side=${side}&option=${optionIndex}`);
  };

  return (
    <Link
      href={`/predictions/${market.id}`}
      className="group rounded-lg p-4 flex flex-col cursor-pointer transition-all duration-300 bg-surface-low">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-clip"
          style={{ backgroundColor: market.iconColor }}
        >
          {market.image ? (
            <img 
              src={market.image} 
              alt="Market Icon" 
              className="w-full h-full object-contain p-[0px] overflow-clip" 
            />
          ) : (
            <>
              {market.tokenIcon}
              {market.icon}
              {/* Fallback to combined text/emoji if no image URL is provided */}
            </>
          )}
        </div>
        <h3 className="text-[13px] font-medium leading-snug font-mono flex-1" style={{ color: "var(--on-surface)" }}>
          {market.question}
        </h3>
      </div>

      {/* Up/Down Special Layout */}
      {isUpDown ? (
        <div className="flex-1">
          {/* Percentage Circle */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(66,70,84,0.5)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--buy)"
                  strokeWidth="3"
                  strokeDasharray={`${market.options[0].percentage}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold font-mono" style={{ color: "var(--on-surface)" }}>
                  {market.options[0].percentage}%
                </span>
                <span className="text-[9px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Up</span>
              </div>
            </div>
          </div>
          {/* Up / Down Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={(e) => handleOptionClick(e, 0, "buy")}
              className="flex-1 py-2 rounded text-[12px] font-medium font-mono transition-colors"
              style={{ background: "rgba(0,192,118,0.12)", color: "var(--buy)", border: "1px solid rgba(0,192,118,0.2)" }}
            >
              Up
            </button>
            <button 
              onClick={(e) => handleOptionClick(e, 1, "sell")}
              className="flex-1 py-2 rounded text-[12px] font-medium font-mono transition-colors"
              style={{ background: "rgba(255,77,79,0.12)", color: "var(--sell)", border: "1px solid rgba(255,77,79,0.2)" }}
            >
              Down
            </button>
          </div>
        </div>
      ) : (
        /* Options List */
        <div className="flex-1 space-y-1.5 mb-3">
          {market.options.map((option, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[12px] font-mono"
              style={{ color: option.direction === "up" ? "var(--buy)" : "var(--sell)" }}
                >
                  {option.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>
                  {option.percentage}%
                </span>
                <button
                  onClick={(e) => handleOptionClick(e, i, "buy")}
                  className="px-2 py-0.5 text-[10px] font-mono rounded transition-colors"
                  style={{ background: "rgba(0,192,118,0.12)", color: "var(--buy)" }}
                >
                  Yes
                </button>
                <button
                  onClick={(e) => handleOptionClick(e, i, "sell")}
                  className="px-2 py-0.5 text-[10px] font-mono rounded transition-colors"
                  style={{ background: "rgba(255,77,79,0.12)", color: "var(--sell)" }}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 mt-auto" style={{ borderTop: "1px solid rgba(66,70,84,0.3)" }}>
        <div className="flex items-center gap-2">
          {market.isLive && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--sell)" }} />
              <span className="text-[10px] font-mono font-medium" style={{ color: "var(--sell)" }}>LIVE</span>
            </div>
          )}
          <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>{market.volume}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="p-1 rounded transition-colors"
            style={{ color: "var(--outline-variant)" }}
            title="Buy"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--outline-variant)")}
          >
            <ShoppingCart size={12} />
          </button>
          <button
            className="p-1 rounded transition-colors"
            style={{ color: "var(--outline-variant)" }}
            title="Bookmark"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--outline-variant)")}
          >
            <Bookmark size={12} />
          </button>
        </div>
      </div>
    </Link>
  );
}

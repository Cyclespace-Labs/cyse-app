"use client";

import { priceHeaderData } from "@/lib/mockData";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { ChevronDown } from "lucide-react";
import { TokenPriceData } from "@/types/trading";

interface PriceHeaderProps {
  onTokenPickerOpen?: () => void;
  selectedSymbol?: string;
  tokenPriceData?: TokenPriceData | null;
}

export default function PriceHeader({ onTokenPickerOpen, selectedSymbol, tokenPriceData }: PriceHeaderProps) {
  const d = tokenPriceData ?? priceHeaderData;
  const displaySymbol = selectedSymbol || d.symbol;

  return (
    <div
      className="flex items-center gap-0 h-[52px] px-4 overflow-x-auto scrollbar-hide border-b"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "rgba(66,70,84,0.4)",
      }}
    >
      {/* Symbol + Leverage */}
      <button
        onClick={onTokenPickerOpen}
        className="flex items-center gap-2 mr-4 shrink-0 rounded px-2 py-1 -ml-2 transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" }}
          />
          <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{displaySymbol}</span>
          <span
            className="px-1.5 py-0.5 text-[10px] font-semibold rounded tracking-wide"
            style={{ color: "var(--tertiary)", background: "rgba(255,182,143,0.1)" }}
          >
            {d.leverage}
          </span>
          <ChevronDown size={14} style={{ color: "var(--on-surface-muted)" }} />
        </div>
      </button>

      {/* Price */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-lg font-bold leading-tight" style={{ color: "var(--buy)" }}>
          {formatPrice(d.price)}
        </span>
        <span className="text-[11px]" style={{ color: "var(--on-surface-muted)" }}>{formatPrice(d.price)}</span>
      </div>

      {/* Ghost Divider */}
      <div className="w-px h-8 mr-4 shrink-0" style={{ background: "rgba(66,70,84,0.3)" }} />

      {/* Index Price */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>Index Price</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatPrice(d.indexPrice)}</span>
      </div>

      {/* 24h Change */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>24h Change</span>
        <span className="text-xs" style={{ color: "var(--sell)" }}>
          {d.change24h.toFixed(2)} / {d.changePct24h.toFixed(2)}%
        </span>
      </div>

      {/* 1h Funding / Countdown */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>1h Funding / Countdown</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>
          {d.funding} / {d.countdown}
        </span>
      </div>

      {/* 24h High */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>24H High</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatPrice(d.high24h)}</span>
      </div>

      {/* 24h Low */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>24H Low</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatPrice(d.low24h)}</span>
      </div>

      {/* 24h Volume */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>24H Volume (USD)</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatVolume(d.volume24h)}</span>
      </div>

      {/* Open Interest */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>Open Interest (SOL)</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>{formatVolume(d.openInterest)}</span>
      </div>

      {/* Profit APY */}
      <div className="flex flex-col shrink-0">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-disabled)" }}>Profit APY</span>
        <span className="text-xs" style={{ color: "var(--buy)" }}>{d.profitApy} ↑</span>
      </div>
    </div>
  );
}

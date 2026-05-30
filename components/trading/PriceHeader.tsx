"use client";

import { formatPrice, formatVolume } from "@/lib/formatters";
import { ChevronDown } from "lucide-react";
import { TokenPriceData } from "@/types/trading";

// Token icon mapping: symbol -> filename in /tokens/
const TOKEN_ICONS: Record<string, string> = {
  BTC: "/tokens/Bitcoin.svg",
  ETH: "/tokens/Ethereum ETH.svg",
  BNB: "/tokens/BNB.svg",
  SOL: "/tokens/Solana SOL.svg",
  USDT: "/tokens/Tether.svg",
  AVAX: "/tokens/Avalanche.svg",
  XRP: "/tokens/XRP.svg",
  ARB: "/tokens/arbitrum-arb-logo.svg",
};

interface PriceHeaderProps {
  onTokenPickerOpen?: () => void;
  selectedSymbol?: string;
  tokenPriceData?: TokenPriceData | null;
  /** Live price from the real-time Pyth stream (overrides tokenPriceData.price) */
  livePrice?: number;
  /** Whether the real-time Pyth stream is connected */
  pythConnected?: boolean;
  /** Oracle source label */
  oracleSource?: string;
  /** Real Open Interest from Vault contract (USD) */
  openInterest?: number;
  /** Real Funding Rate from Vault contract (percentage) */
  fundingRate?: number;
  /** Whether vault data is loading */
  isLoadingVaultData?: boolean;
  /** 24h data from Binance API */
  binance24hChange?: number;
  binance24hChangePercent?: number;
  binance24hHigh?: number;
  binance24hLow?: number;
  binance24hVolume?: number;
  isLoadingBinanceData?: boolean;
}

export default function PriceHeader({
  onTokenPickerOpen,
  selectedSymbol,
  tokenPriceData,
  livePrice,
  pythConnected,
  oracleSource,
  openInterest,
  fundingRate,
  isLoadingVaultData,
  binance24hChange,
  binance24hChangePercent,
  binance24hHigh,
  binance24hLow,
  binance24hVolume,
  isLoadingBinanceData,
}: PriceHeaderProps) {
  const d = tokenPriceData ?? null;
  const displaySymbol = selectedSymbol || d?.symbol || "—";
  const baseSymbol = displaySymbol.replace(/-PERP$/, "");
  const na = "—";

  // Use livePrice (from Pyth/oracle) if available, otherwise fall back to tokenPriceData
  const currentDisplayPrice = livePrice && livePrice > 0 ? livePrice : d?.price ?? 0;

  // Use real Open Interest from Vault contract
  const displayOpenInterest: number | undefined = openInterest;
  // Use real Funding Rate from Vault contract
  const displayFundingRate: number | undefined = fundingRate;

  // Use real Binance 24h data - no fallback to mock data
  const display24hChange = binance24hChange;
  const display24hChangePercent = binance24hChangePercent;
  const display24hHigh = binance24hHigh;
  const display24hLow = binance24hLow;
  const display24hVolume = binance24hVolume;

  const changeColor = (display24hChangePercent ?? 0) >= 0 ? "var(--buy)" : "var(--sell)";

  return (
    <div
      className="flex items-center gap-0 h-[52px] px-4 overflow-x-auto bg-background scrollbar-hide border-b border-outline"
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
          {TOKEN_ICONS[baseSymbol] ? (
            <img
              src={TOKEN_ICONS[baseSymbol]}
              alt={baseSymbol}
              className="w-5 h-5 rounded-full shrink-0 object-contain"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" }}
            />
          )}
          <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{displaySymbol}</span>
          <span
            className="px-1.5 py-0.5 text-[10px] font-semibold rounded tracking-wide"
            style={{ color: "var(--tertiary)", background: "rgba(255,182,143,0.1)" }}
          >
            {d?.leverage ?? na}
          </span>
          <ChevronDown size={14} style={{ color: "var(--on-surface-muted)" }} />
        </div>
      </button>

      {/* Price — live from Pyth stream */}
      <div className="flex flex-col mr-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold leading-tight" style={{ color: "var(--buy)" }}>
            ${currentDisplayPrice > 0 ? formatPrice(currentDisplayPrice) : na}
          </span>
        </div>

        {/*sub price indicator is hidden for now*/}
        <span className="text-[11px] hidden" style={{ color: "var(--on-surface-muted)" }}>
          {currentDisplayPrice > 0 ? formatPrice(currentDisplayPrice) : na}
          {oracleSource && (
            <span className="ml-1 opacity-60">
              {oracleSource === "websocket" ? "PYTH" : oracleSource.toUpperCase()}
            </span>
          )}
        </span>
      </div>

      {/* Ghost Divider */}
      <div className="w-px h-8 mr-4 shrink-0" style={{ background: "rgba(66,70,84,0.3)" }} />

      {/* Index Price — from oracle or tokenPriceData */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">Index Price</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>
          {currentDisplayPrice > 0 ? formatPrice(currentDisplayPrice) : d ? formatPrice(d.indexPrice) : na}
        </span>
      </div>

      {/* 24h Change - From Binance API */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">24h Change</span>
        <span className="text-xs" style={{ color: changeColor }}>
          {isLoadingBinanceData ? "..." : display24hChange !== undefined && display24hChangePercent !== undefined
            ? `${display24hChange.toFixed(2)} / ${display24hChangePercent.toFixed(2)}%`
            : na}
        </span>
      </div>

      {/* 24h High - From Binance API */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">24H High</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>
          {isLoadingBinanceData ? "..." : display24hHigh !== undefined ? formatPrice(display24hHigh) : na}
        </span>
      </div>

      {/* 24h Low - From Binance API */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">24H Low</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>
          {isLoadingBinanceData ? "..." : display24hLow !== undefined ? formatPrice(display24hLow) : na}
        </span>
      </div>

      {/* 24h Volume - From Binance API */}
      <div className="flex flex-col mr-5 shrink-0">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">24H Volume (USD)</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>
          {isLoadingBinanceData ? "..." : display24hVolume !== undefined ? formatVolume(display24hVolume) : na}
        </span>
      </div>

      {/* Open Interest - Real from Vault contract */}
      <div className="flex flex-col mr-5 shrink-0 hidden">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">Open Interest</span>
        <span className="text-xs" style={{ color: "var(--on-surface)" }}>
          {isLoadingVaultData ? "..." : displayOpenInterest !== undefined ? formatVolume(displayOpenInterest) : na}
        </span>
      </div>

      {/* Funding Rate - Real from Vault contract */}
      <div className="flex flex-col shrink-0 hidden">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-muted">Funding Rate</span>
        <span className="text-xs" style={{ color: displayFundingRate !== undefined && displayFundingRate >= 0 ? "var(--buy)" : "var(--sell)" }}>
          {isLoadingVaultData ? "..." : displayFundingRate !== undefined ? `${displayFundingRate.toFixed(4)}%` : na}
        </span>
      </div>
    </div>
  );
}

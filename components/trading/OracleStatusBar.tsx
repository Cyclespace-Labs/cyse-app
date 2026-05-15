"use client";

import { Shield } from "lucide-react";

interface OracleStatusBarProps {
  oracleSource: string;
  websocketConnected: boolean;
  isOracleStale: boolean;
  isOracleValid: boolean;
  currentPrice: number;
  oracleMinPrice: number | null;
  oracleMaxPrice: number | null;
  oracleSpread: number;
}

export default function OracleStatusBar({
  oracleSource,
  websocketConnected,
  isOracleStale,
  isOracleValid,
  currentPrice,
  oracleMinPrice,
  oracleMaxPrice,
  oracleSpread,
}: OracleStatusBarProps) {
  return (
    <div
      className="px-3 py-1 flex items-center justify-between text-[10px]"
      style={{ borderBottom: "1px solid rgba(66,70,84,0.3)" }}
    >
      <div className="flex items-center gap-1.5" style={{ color: "var(--on-surface-disabled)" }}>
        <Shield size={9} style={{ color: isOracleValid ? "var(--buy)" : "var(--sell)" }} />
        <span>
          {oracleSource === "pyth" ? "PYTH" : oracleSource.toUpperCase()}
          {websocketConnected ? " · 1s" : isOracleStale ? " · Stale" : ""}
        </span>
        {oracleSpread > 0 && (
          <span className="font-mono text-[9px]" style={{ color: "var(--on-surface-disabled)", opacity: 1 }}>
            spread ${oracleSpread.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {oracleMinPrice !== null && oracleMaxPrice !== null && (
          <span className="font-mono text-[9px]" style={{ color: "var(--on-surface-disabled)", opacity: 0.6 }}>
            {oracleMinPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}–{oracleMaxPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        )}
        <span
          className="font-mono text-[10px]"
          style={{ color: isOracleValid ? "var(--on-surface-muted)" : "var(--sell)" }}
        >
          {currentPrice > 0 ? `$${currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
        </span>
      </div>
    </div>
  );
}

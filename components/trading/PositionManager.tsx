"use client";

import { useState, useEffect } from "react";
import { formatUnits } from "viem";
import LiquidationGauge from "./LiquidationGauge";
import type { VaultPositionEntry } from "@/hooks/useAllVaultPositions";

interface DecreaseOrder {
  index: number;
  isLong: boolean;
  indexToken: string;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
}

interface PositionManagerProps {
  walletConnected: boolean;
  positions: VaultPositionEntry[];
  decreaseOrders: DecreaseOrder[];
  activeIndexToken: string;
  currentPrice: number;
  symbol: string;
  orderSigning: boolean;
  healthScore: number;
  healthStatus: "safe" | "warning" | "danger" | "liquidated";
  liquidationPrice: number | null;
  isLong: boolean;
  slippageBps: number;
  onClosePosition: (pos: VaultPositionEntry, closePercentage: number) => void;
  onCancelDecreaseOrder: (index: number) => void;
  onAddTPSL: (pos: VaultPositionEntry, tpPrice: string, slPrice: string) => void;
}

export default function PositionManager({
  walletConnected,
  positions,
  decreaseOrders,
  activeIndexToken,
  currentPrice,
  symbol,
  orderSigning,
  healthScore,
  healthStatus,
  liquidationPrice,
  isLong,
  slippageBps,
  onClosePosition,
  onCancelDecreaseOrder,
  onAddTPSL,
}: PositionManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [closePercentage, setClosePercentage] = useState(100);
  const [tpslPositionKey, setTpslPositionKey] = useState<string | null>(null);
  const [tpslTpPrice, setTpslTpPrice] = useState("");
  const [tpslSlPrice, setTpslSlPrice] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !walletConnected || positions.length === 0) return null;

  return (
    <div className="pt-2 border-t border-outline">
      <span className="text-[11px] mb-2 block text-on-surface-muted">Active Positions</span>
      {positions.map((pos) => {
        // Contract-accurate PnL: Vault.getDelta → delta = size * priceDelta / avgPrice
        const priceDelta = pos.isLong
          ? currentPrice - pos.avgPriceFormatted
          : pos.avgPriceFormatted - currentPrice;
        const livePnl = pos.avgPriceFormatted > 0
          ? (pos.sizeUsd * priceDelta) / pos.avgPriceFormatted
          : 0;
        // PnL% = return on margin (collateral), same as GMX convention
        const livePnlPct = pos.collateralUsd > 0 ? (livePnl / pos.collateralUsd) * 100 : 0;
        const pnlColor = livePnl >= 0 ? "var(--buy)" : "var(--sell)";
        const leverage = pos.collateralUsd > 0 ? pos.sizeUsd / pos.collateralUsd : 0;

        // Match attached TP/SL decrease orders to this exact position
        const attachedOrders = decreaseOrders.filter((o) =>
          o.isLong === pos.isLong &&
          o.indexToken.toLowerCase() === activeIndexToken.toLowerCase()
        );
        const attachedTp = attachedOrders.find((o) => (o.isLong && o.triggerAboveThreshold) || (!o.isLong && !o.triggerAboveThreshold));
        const attachedSl = attachedOrders.find((o) => (o.isLong && !o.triggerAboveThreshold) || (!o.isLong && o.triggerAboveThreshold));

        return (
          <div key={pos.id} className="rounded p-2.5 mb-2 bg-surface-low">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono font-medium" style={{ color: pos.isLong ? "var(--buy)" : "var(--sell)" }}>
                {pos.isLong ? "LONG" : "SHORT"} {symbol} {leverage.toFixed(1)}×
              </span>
              <span className="text-[10px] text-on-surface-muted">
                ${pos.sizeUsd.toFixed(2)}
              </span>
            </div>
            {/* Collateral / Margin indicator */}
            {(() => {
              const marginRatioPct = pos.sizeUsd > 0 ? (pos.collateralUsd / pos.sizeUsd) * 100 : 0;
              const barFillPct = Math.min(100, marginRatioPct * 2); // 50% margin ratio fills bar fully
              const barColor =
                leverage > 25 ? "var(--sell)" :
                leverage > 15 ? "#f59e0b" :
                leverage > 8  ? "#3b82f6" :
                "var(--buy)";
              return (
                <div className="mb-2 rounded p-1.5 border border-surface-container">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-on-surface-muted">Margin (Collateral)</span>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: barColor }}>
                      ${pos.collateralUsd.toFixed(2)}
                      <span className="ml-1 font-normal opacity-60">({marginRatioPct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="relative w-full h-1 rounded-full overflow-hidden bg-outline-variant">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${barFillPct}%`, background: barColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-on-surface-muted">high risk</span>
                    <span className="text-[9px] text-on-surface-muted">low risk</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-on-surface-muted">Entry</span>
              <span className="text-on-surface">{pos.avgPriceFormatted.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-on-surface-muted">Liq. Price</span>
              <span className="font-mono text-liquidation">{pos.liquidationPrice.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span style={{ color: "var(--on-surface-disabled)" }}>Unrealized PnL</span>
              <span className="font-mono" style={{ color: pnlColor }}>
                {livePnl >= 0 ? "+" : ""}${livePnl.toFixed(2)} ({livePnlPct.toFixed(2)}% of margin)
              </span>
            </div>
            {(attachedTp || attachedSl) && (
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span style={{ color: "var(--on-surface-disabled)" }}>TP / SL</span>
                <span className="font-mono">
                  {attachedTp && (
                    <span style={{ color: "var(--buy)" }}>TP {parseFloat(formatUnits(attachedTp.triggerPrice, 30)).toFixed(2)}</span>
                  )}
                  {attachedTp && attachedSl && <span style={{ color: "var(--on-surface-disabled)" }}> / </span>}
                  {attachedSl && (
                    <span style={{ color: "var(--sell)" }}>SL {parseFloat(formatUnits(attachedSl.triggerPrice, 30)).toFixed(2)}</span>
                  )}
                </span>
              </div>
            )}

            {/* Position Health Gauge */}
            {pos.isLong === isLong && (
              <div className="mb-2">
                <LiquidationGauge
                  healthScore={healthScore}
                  status={healthStatus}
                  liquidationPrice={liquidationPrice}
                  currentPrice={currentPrice}
                  isLong={pos.isLong}
                />
              </div>
            )}

            <button
              onClick={() => onClosePosition(pos, closePercentage)}
              disabled={orderSigning}
              className="w-full py-1.5 text-[11px] font-mono rounded transition-colors hover:bg-sell/20 text-sell border border-sell"
            >
              Close Position ({closePercentage}%)
            </button>

            {/* Partial Close Slider */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>Close Amount</span>
                <span className="text-[10px] font-mono" style={{ color: "var(--on-surface)" }}>{closePercentage}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="100"
                step="25"
                value={closePercentage}
                onChange={(e) => setClosePercentage(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setClosePercentage(pct)}
                    className="text-[10px] font-mono transition-colors"
                    style={{ color: closePercentage === pct ? "var(--on-surface)" : "var(--on-surface-disabled)" }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Standalone TP/SL for existing position */}
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(66,70,84,0.3)" }}>
              {tpslPositionKey === pos.id ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] mb-1 block" style={{ color: "var(--buy)" }}>Take Profit</label>
                    <div className="flex items-center rounded px-2 py-1" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
                      <input
                        type="text"
                        value={tpslTpPrice}
                        onChange={(e) => setTpslTpPrice(e.target.value)}
                        placeholder="TP Price"
                        className="flex-1 bg-transparent text-xs outline-none font-mono"
                        style={{ color: "var(--on-surface)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] mb-1 block" style={{ color: "var(--sell)" }}>Stop Loss</label>
                    <div className="flex items-center rounded px-2 py-1" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
                      <input
                        type="text"
                        value={tpslSlPrice}
                        onChange={(e) => setTpslSlPrice(e.target.value)}
                        placeholder="SL Price"
                        className="flex-1 bg-transparent text-xs outline-none font-mono"
                        style={{ color: "var(--on-surface)" }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onAddTPSL(pos, tpslTpPrice, tpslSlPrice);
                        setTpslPositionKey(null);
                        setTpslTpPrice("");
                        setTpslSlPrice("");
                      }}
                      disabled={orderSigning}
                      className="flex-1 py-1 text-[10px] font-mono rounded transition-colors"
                      style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
                    >
                      Place TP/SL
                    </button>
                    <button
                      onClick={() => {
                        setTpslPositionKey(null);
                        setTpslTpPrice("");
                        setTpslSlPrice("");
                      }}
                      className="px-2 py-1 text-[10px] rounded transition-colors"
                      style={{ background: "var(--surface-container-high)", color: "var(--on-surface-disabled)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTpslPositionKey(pos.id);
                    setTpslTpPrice(attachedTp ? parseFloat(formatUnits(attachedTp.triggerPrice, 30)).toFixed(4) : "");
                    setTpslSlPrice(attachedSl ? parseFloat(formatUnits(attachedSl.triggerPrice, 30)).toFixed(4) : "");
                  }}
                  disabled={orderSigning}
                  className="w-full py-1 text-[10px] font-mono rounded transition-colors"
                  style={{ border: "1px solid rgba(99,179,255,0.3)", color: "#63b3ff", background: "transparent" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,179,255,0.08)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {attachedTp || attachedSl ? "Update TP/SL" : "Add TP/SL"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

const pctButtons = [25, 50, 75, 100];

interface OrderFormInputsProps {
  isMarket: boolean;
  price: string;
  onPriceChange: (value: string) => void;
  collateralInput: string;        // collateral/margin amount in USD
  onCollateralChange: (value: string) => void;
  leverage: number;
  onLeverageChange: (value: number) => void;
  currentPrice: number;
  indexPrice: number;             // effective entry price (oracle for market, limit price for limit)
  symbol: string;
  walletConnected: boolean;
  onPctQuantity: (pct: number) => void;
  orderValue: number;             // derived position size in USD (collateral × leverage)
  insufficientBalance: boolean;
  estLiquidation: number | null;
  side: "buy" | "sell";
  priceImpact: { impact: number; warning?: string | null };
}

export default function OrderFormInputs({
  isMarket,
  price,
  onPriceChange,
  collateralInput,
  onCollateralChange,
  leverage,
  onLeverageChange,
  currentPrice,
  indexPrice,
  symbol,
  walletConnected,
  onPctQuantity,
  orderValue,
  insufficientBalance,
  estLiquidation,
  side,
  priceImpact,
}: OrderFormInputsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derived: token quantity = collateral × leverage / indexPrice
  const collateralNum = parseFloat(collateralInput) || 0;
  const tokenQty = collateralNum > 0 && indexPrice > 0
    ? (collateralNum * leverage) / indexPrice
    : 0;

  return (
    <>
      {/* Limit Price Input */}
      {!isMarket && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="price-input" className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Limit Price</label>
            <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>USD</span>
          </div>
          <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
            <input
              id="price-input"
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
              className="flex-1 bg-transparent text-sm outline-none font-mono"
              style={{ color: "var(--on-surface)" }}
            />
            <button
              onClick={() => onPriceChange(currentPrice > 0 ? currentPrice.toFixed(2) : "")}
              className="text-[10px] px-1.5 py-0.5 rounded transition-colors ml-2 shrink-0 text-on-surface-muted bg-surface-container dark:bg-surface-container-low hover:text-on-surface"
            >
              Mark
            </button>
          </div>
        </div>
      )}

      {/* Collateral Input — user enters margin in USD */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="collateral-input" className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Collateral</label>
          <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>USD</span>
        </div>
        <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
          <span className="text-sm font-mono mr-1" style={{ color: "var(--on-surface-disabled)" }}>$</span>
          <input
            id="collateral-input"
            type="text"
            value={collateralInput}
            onChange={(e) => onCollateralChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-sm outline-none font-mono"
            style={{ color: "var(--on-surface)" }}
          />
          {/* Token qty derived hint */}
          {tokenQty > 0 && (
            <span className="text-[10px] hidden ml-2 shrink-0 font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              ≈ {tokenQty.toFixed(4)} {symbol}
            </span>
          )}
        </div>
        {mounted && walletConnected && (
          <div className="flex items-center gap-1 mt-1.5">
            {pctButtons.map((pct) => (
              <button
                key={pct}
                onClick={() => onPctQuantity(pct)}
                className="flex-1 py-1 text-[10px] font-mono rounded transition-colors bg-surface-container dark:bg-surface-low text-on-surface-muted hover:bg-surface-bright hover:text-on-surface"
              >
                {pct}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leverage Slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="leverage-slider" className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Leverage</label>
          <span className="text-[11px] font-mono" style={{ color: "var(--on-surface)" }}>{leverage}×</span>
        </div>
        <input
          id="leverage-slider"
          type="range"
          min={1}
          max={50}
          value={leverage}
          onChange={(e) => onLeverageChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          {[1, 5, 10, 20, 50].map((l) => (
            <button
              key={l}
              onClick={() => onLeverageChange(l)}
              className="text-[10px] font-mono transition-colors"
              style={{ color: leverage === l ? "var(--on-surface)" : "var(--on-surface-disabled)" }}
            >
              {l}×
            </button>
          ))}
        </div>
      </div>

      {/* Position Size (derived) + Est. Liquidation */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: "var(--on-surface-disabled)" }}>Position Size</span>
          <span style={{ color: insufficientBalance ? "var(--sell)" : "var(--on-surface)" }}>
            {orderValue > 0 ? `$${orderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: "var(--on-surface-disabled)" }}>Est. Liquidation Price</span>
          <span style={{ color: "var(--liquidation)" }}>{estLiquidation !== null ? estLiquidation : "—"}</span>
        </div>
      </div>

      {/* Price Impact */}
      {orderValue > 0 && priceImpact.impact > 0.1 && (
        <div className="flex items-center rounded px-3 py-1.5" style={{ background: priceImpact.impact > 1 ? "rgba(255,77,79,0.1)" : "rgba(255,165,0,0.05)" }}>
          <span className="text-[10px] font-mono" style={{ color: priceImpact.impact > 1 ? "var(--sell)" : "#FFA500" }}>
            Price impact {priceImpact.impact.toFixed(2)}%
          </span>
          {priceImpact.warning && (
            <span className="ml-2 text-[10px]" style={{ color: priceImpact.impact > 1 ? "var(--sell)" : "#FFA500" }}>
              {priceImpact.warning}
            </span>
          )}
        </div>
      )}
    </>
  );
}

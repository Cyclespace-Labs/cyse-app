"use client";

import { useState, useEffect } from "react";
import { Input } from "../ui/input";

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
          <div className="flex items-center justify-between mb-1 ">
            <label htmlFor="price-input" className="text-[11px]" style={{ color: "var(--on-surface-muted)" }}>Limit Price</label>
            <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-muted)" }}>USD</span>
          </div>
          <div className="flex items-center rounded-lg px-3 py-2 bg-surface-container dark:bg-surface-low  
          border-b-2 border-outline/70 dark:border-surface-container/70">
            <Input
              id="price-input"
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
              className="flex-1 bg-transparent  outline-none font-mono text-on-surface p-0"
              style={{fontSize: "13px"}}
            />
            <button
              onClick={() => onPriceChange(currentPrice > 0 ? currentPrice.toFixed(2) : "")}
              className="text-[10px] px-1.5 py-0.5 rounded-sm transition-colors ml-1 shrink-0 text-on-surface-muted bg-surface-high dark:bg-surface-container hover:text-on-surface"
            >
              Mark
            </button>
          </div>
        </div>
      )}

      {/* Collateral Input — user enters margin in USD */}
      <div>
        <div className="flex items-center justify-between mb-1 ">
          <label htmlFor="collateral-input" className="text-[11px] text-on-surface-muted">Collateral</label>
          <span className="text-[10px] font-mono text-on-surface-muted">USD</span>
        </div>
        <div className="flex items-center rounded-lg px-3 py-2 bg-surface-container dark:bg-surface-low border-b-2 border-outline/50 dark:border-surface-container/60 gap-0">
          <span className="text-sm font-mono mr-1 text-on-surface-muted">$</span>
          <Input
            id="collateral-input"
            type="number"
            value={collateralInput}
            onChange={(e) => onCollateralChange(e.target.value)}
            placeholder="0.00"
            className="bg-transparent  outline-none font-mono"
            style={{ color: "var(--on-surface)", fontSize: "14px", }}
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
                className="flex-1 py-1 text-[10px] font-mono rounded-sm transition-colors 
                  bg-surface-container dark:bg-surface-low text-on-surface-muted hover:bg-surface-bright 
                  hover:text-on-surface border border-surface-container/60 dark:border-surface-container/60"
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
          <label htmlFor="leverage-slider" className="text-[11px] text-on-surface-muted">Leverage</label>
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
          <span className="text-on-surface-muted">Position Size</span>
          <span className={insufficientBalance ? "text-[var(--sell)]" : "text-[var(--on-surface)]"}>
            {orderValue > 0 ? `$${orderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-on-surface-muted">Est. Liquidation Price</span>
          <span className="text-liquidation">{estLiquidation !== null ? estLiquidation : "—"}</span>
        </div>
      </div>

      {/* Price Impact */}
      {orderValue > 0 && priceImpact.impact > 0.1 && (
        <div className={priceImpact.impact > 1 ? "flex items-center rounded px-3 py-1.5 bg-sell/10" : "flex items-center rounded px-3 py-1.5 bg-orange-500/10"}>
          <span className={priceImpact.impact > 1 ? "text-[10px] font-mono text-[var(--sell)]" : "text-[10px] font-mono text-orange-500"}>
            Price impact {priceImpact.impact.toFixed(2)}%
          </span>
          {priceImpact.warning && (
            <span className={priceImpact.impact > 1 ? "ml-2 text-[10px] text-[var(--sell)]" : "ml-2 text-[10px] text-orange-500"}>
              {priceImpact.warning}
            </span>
          )}
        </div>
      )}
    </>
  );
}

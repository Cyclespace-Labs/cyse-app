"use client";

import { ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const orderTypes = ["Limit", "Market", "Swap"];

interface OrderTypeSelectorProps {
  side: "buy" | "sell";
  onSideChange: (side: "buy" | "sell") => void;
  activeType: string;
  onTypeChange: (type: string) => void;
}

export default function OrderTypeSelector({
  side,
  onSideChange,
  activeType,
  onTypeChange,
}: OrderTypeSelectorProps) {
  const { theme } = useTheme();

  const isSwapMode = activeType === "Swap";

  return (
    <>
      {/* Buy/Sell Toggle — hidden in Swap mode */}
      {!isSwapMode && <div className="flex" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <button
          onClick={() => onSideChange("buy")}
          className={side === "buy" ? 
            "flex-1 py-2.5 text-[13px] font-semibold transition-colors text-buy border-b-2 border-buy" : 
            "flex-1 py-2.5 text-[13px] font-semibold transition-colors text-on-surface-muted border-b-2 border-transparent"}
        >
          Buy / Long
        </button>
        <button
          onClick={() => onSideChange("sell")}
          className={side === "buy" ? 
            "flex-1 py-2.5 text-[13px] font-semibold transition-colors text-on-surface-muted border-b-2 border-transparent" : 
            "flex-1 py-2.5 text-[13px] font-semibold transition-colors text-sell border-b-2 border-sell"}
        >
          Sell / Short
        </button>
      </div>}

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {orderTypes.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className="px-2.5 py-1 text-[11px] rounded-md transition-colors"
            style={{
              color: activeType === type ? "var(--on-surface)" : "var(--on-surface-disabled)",
              background: activeType === type ? (theme === "dark" ? "var(--surface-container-low)" : "var(--surface-container)") : "transparent",
            }}
          >
            {type}
          </button>
        ))}
        <ChevronDown size={12} className="ml-auto" style={{ color: "var(--on-surface-disabled)" }} />
      </div>
    </>
  );
}

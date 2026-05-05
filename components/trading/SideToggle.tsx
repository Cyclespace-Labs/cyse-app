"use client";

interface SideToggleProps {
  side: "buy" | "sell";
  onChange: (side: "buy" | "sell") => void;
}

export default function SideToggle({ side, onChange }: SideToggleProps) {
  return (
    <div className="flex" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
      <button
        onClick={() => onChange("buy")}
        className="flex-1 py-2.5 text-[13px] font-semibold transition-colors"
        style={{
          color: side === "buy" ? "var(--buy)" : "var(--on-surface-disabled)",
          borderBottom: side === "buy" ? "2px solid var(--buy)" : "2px solid transparent",
        }}
      >
        Buy / Long
      </button>
      <button
        onClick={() => onChange("sell")}
        className="flex-1 py-2.5 text-[13px] font-semibold transition-colors"
        style={{
          color: side === "sell" ? "var(--sell)" : "var(--on-surface-disabled)",
          borderBottom: side === "sell" ? "2px solid var(--sell)" : "2px solid transparent",
        }}
      >
        Sell / Short
      </button>
    </div>
  );
}

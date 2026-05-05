"use client";

import { ChevronDown } from "lucide-react";

interface OrderTypeTabsProps {
  options: string[];
  activeType: string;
  onChange: (type: string) => void;
}

export default function OrderTypeTabs({ options, activeType, onChange }: OrderTypeTabsProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
      {options.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className="px-2.5 py-1 text-[11px] rounded transition-colors"
          style={{
            color: activeType === type ? "var(--on-surface)" : "var(--on-surface-disabled)",
            background: activeType === type ? "var(--surface-container-high)" : "transparent",
          }}
        >
          {type}
        </button>
      ))}
      <ChevronDown size={12} className="ml-auto" style={{ color: "var(--on-surface-disabled)" }} />
    </div>
  );
}

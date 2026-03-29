"use client";

import { predictionCategories } from "@/lib/predictionsData";
import {
  Clock,
  Timer,
  Hourglass,
  Calendar,
  CalendarDays,
  CalendarRange,
  TrendingUp,
  Layers,
  Bitcoin,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  All: <Layers size={14} />,
  "5 Min": <Timer size={14} />,
  "15 Min": <Timer size={14} />,
  "1 Hour": <Clock size={14} />,
  "4 Hours": <Hourglass size={14} />,
  Daily: <Calendar size={14} />,
  Weekly: <CalendarDays size={14} />,
  Monthly: <CalendarRange size={14} />,
  Yearly: <CalendarRange size={14} />,
  "Pre-Market": <TrendingUp size={14} />,
  ETF: <Layers size={14} />,
  Bitcoin: <Bitcoin size={14} />,
};

interface PredictionsSidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function PredictionsSidebar({
  activeCategory,
  onCategoryChange,
}: PredictionsSidebarProps) {
  return (
    <aside className="w-[200px] shrink-0 overflow-y-auto scrollbar-hide" style={{ background: "var(--surface-container-lowest)", borderRight: "1px solid rgba(66,70,84,0.4)" }}>
      <div className="py-2">
        {predictionCategories.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onCategoryChange(cat.label)}
              className="w-full flex items-center justify-between px-4 py-2 text-[13px] transition-colors group font-mono border-l-2"
              style={{
                color: isActive ? "var(--on-surface)" : "var(--on-surface-muted)",
                background: isActive ? "var(--surface-container)" : "transparent",
                borderLeftColor: isActive ? "var(--primary)" : "transparent",
              }}
              onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(28,28,40,0.4)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; } }}
              onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)"; } }}
            >
              <div className="flex items-center gap-2.5">
                <span style={{ color: isActive ? "var(--primary)" : "var(--on-surface-disabled)" }}>
                  {categoryIcons[cat.label] || (
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{
                        background:
                          cat.label === "Ethereum"
                            ? "#627eea"
                            : cat.label === "Solana"
                              ? "#9945ff"
                              : cat.label === "XRP"
                                ? "#00aae4"
                                : cat.label === "Dogecoin"
                                  ? "#c2a633"
                                  : cat.label === "BNB"
                                    ? "#f3ba2f"
                                    : cat.label === "MicroStrategy"
                                      ? "#ff4d4f"
                                      : "#5a5a6a",
                      }}
                    />
                  )}
                </span>
                <span className="font-mono">{cat.label}</span>
              </div>
              <span
                className="text-[11px] font-mono"
                style={{ color: isActive ? "var(--primary)" : "var(--on-surface-disabled)" }}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

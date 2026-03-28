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
    <aside className="w-[200px] shrink-0 border-r border-[#1c1c28] bg-[#0b0b0e] overflow-y-auto scrollbar-hide">
      <div className="py-2">
        {predictionCategories.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onCategoryChange(cat.label)}
              className={`w-full flex items-center justify-between px-4 py-2 text-[13px] transition-colors group ${
                isActive
                  ? "text-white bg-[#1c1c28] border-l-2 border-[#00c076]"
                  : "text-[#8a8a9a] hover:text-white hover:bg-[#1c1c28]/40 border-l-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? "text-[#00c076]" : "text-[#5a5a6a] group-hover:text-[#8a8a9a]"}>
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
                className={`text-[11px] font-mono ${
                  isActive ? "text-[#00c076]" : "text-[#5a5a6a]"
                }`}
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

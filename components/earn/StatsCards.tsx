"use client";

import { PortfolioStats } from "@/types/earn";

interface StatsCardsProps {
  stats: PortfolioStats;
}

const formatCurrency = (val: number) =>
  val === 0 ? "$0.00" : `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    { label: "Total investment value", value: formatCurrency(stats.totalInvestmentValue) },
    { label: "Total earned", value: formatCurrency(stats.totalEarned) },
    { label: "Total pending rewards", value: formatCurrency(stats.totalPendingRewards), accent: true },
    {
      label: "Buyback accrued",
      value: `${stats.buybackAccrued.toLocaleString()} ${stats.buybackToken}`,
    },
  ];

  return (
    <div className="flex items-center gap-6 px-5 py-3 border-b border-[#1c1c28] bg-[#0b0b0e]">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${
              item.accent ? "text-[#ff4d4f]" : "text-[#5a5a6a]"
            }`}
          >
            {item.label}
          </span>
          <span className="text-white text-[15px] font-mono font-semibold">{item.value}</span>
        </div>
      ))}
      <div className="ml-auto">
        <button className="px-4 py-1.5 text-[11px] font-mono border border-[#2a2a3a] text-[#8a8a9a] rounded hover:bg-[#1c1c28] hover:text-white transition-colors">
          Claim rewards
        </button>
      </div>
    </div>
  );
}

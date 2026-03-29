"use client";

import { EarnOpportunity } from "@/types/earn";
import { Zap, ArrowRight } from "lucide-react";

interface RecommendedSectionProps {
  opportunities: EarnOpportunity[];
  onBuyClick?: (type: string) => void;
}

export default function RecommendedSection({ opportunities, onBuyClick }: RecommendedSectionProps) {
  const gmx = opportunities.filter((o) => o.type === "GMX");
  const glv = opportunities.filter((o) => o.type === "GLV");
  const gm = opportunities.filter((o) => o.type === "GM");

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-[#f59e0b]" />
        <h2 className="text-white text-[15px] font-semibold">Recommended</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* GMX Section */}
        {gmx.length > 0 && (
          <div className="bg-[#12121a] border border-[#1c1c28] rounded-lg p-4">
            <h3 className="text-[#5a5a6a] text-[11px] font-mono uppercase tracking-wider mb-3">CYSE</h3>
            {gmx.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.logo}
                  </div>
                  <span className="text-white text-[13px] font-mono">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#5a5a6a] text-[11px] font-mono">{item.apyLabel}</span>
                  <button
                    onClick={() => onBuyClick?.(item.type)}
                    className="px-3 py-1.5 text-[11px] font-mono font-semibold bg-[#0E76FD] text-white rounded hover:bg-[#2d8afd] transition-colors"
                  >
                    Buy CYSE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GLV Vaults */}
        {glv.length > 0 && (
          <div className="bg-[#12121a] border border-[#1c1c28] rounded-lg p-4">
            <h3 className="text-[#5a5a6a] text-[11px] font-mono uppercase tracking-wider mb-3">GLV vaults</h3>
            {glv.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.logo}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-[12px] font-mono">{item.title}</span>
                    <span className="text-[#5a5a6a] text-[10px] font-mono">{item.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#5a5a6a] text-[11px] font-mono">{item.apyLabel}</span>
                  <button className="px-3 py-1.5 text-[11px] font-mono font-semibold bg-[#0E76FD] text-white rounded hover:bg-[#2d8afd] transition-colors">
                    Earn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GM Pools */}
        {gm.length > 0 && (
          <div className="bg-[#12121a] border border-[#1c1c28] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#5a5a6a] text-[11px] font-mono uppercase tracking-wider">GM pools</h3>
              <button className="text-[#0E76FD] text-[11px] font-mono flex items-center gap-1 hover:underline">
                Explore more <ArrowRight size={11} />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {gm.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.logo}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-[12px] font-mono">{item.title}</span>
                      <span className="text-[#5a5a6a] text-[10px] font-mono">[{item.subtitle}]</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#5a5a6a] text-[10px] font-mono">{item.apyLabel}</span>
                    <button className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-[#0E76FD] text-white rounded hover:bg-[#2d8afd] transition-colors">
                      Earn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

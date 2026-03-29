"use client";

import { useState } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import VaultTable from "@/components/vault/VaultTable";
import PoolTable from "@/components/vault/PoolTable";
import { glvVaults, gmPools, poolFilters, totalTVL } from "@/lib/vaultData";

const timeRanges = ["Last 30d", "Last 90d", "Last 180d", "Total"];

export default function VaultPage() {
  const [activeTimeRange, setActiveTimeRange] = useState("Total");

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <TopNavigation />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* TVL Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-[32px] font-semibold font-mono tracking-tight">
                ${totalTVL.toLocaleString()}
              </h1>
              <p className="text-[#5a5a6a] text-[13px] font-mono mt-1">
                TVL in vaults and pools
              </p>
            </div>
            <div className="flex items-center gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveTimeRange(range)}
                  className={`px-3 py-1.5 text-[11px] font-mono rounded transition-colors ${
                    activeTimeRange === range
                      ? "bg-[#0E76FD] text-white"
                      : "text-[#5a5a6a] hover:text-white hover:bg-[#1c1c28]"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GLV Vaults */}
        <div className="px-5 pb-5">
          <VaultTable
            title="GLV vaults"
            description="Yield-optimized vaults supplying liquidity across multiple Cyclespace markets"
            vaults={glvVaults}
          />
        </div>

        {/* GM Pools */}
        <div className="px-5 pb-5">
          <PoolTable pools={gmPools} filters={poolFilters} />
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <TopNavigation />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* TVL Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[32px] font-semibold font-mono tracking-tight" style={{ color: "var(--on-surface)" }}>
                ${totalTVL.toLocaleString()}
              </h1>
              <p className="text-[13px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                TVL in vaults and pools
              </p>
            </div>
            <div className="flex items-center gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveTimeRange(range)}
                  className="px-3 py-1.5 text-[11px] font-mono rounded transition-colors"
                  style={{
                    background: activeTimeRange === range ? "var(--primary)" : "transparent",
                    color: activeTimeRange === range ? "#fff" : "var(--on-surface-disabled)",
                  }}
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

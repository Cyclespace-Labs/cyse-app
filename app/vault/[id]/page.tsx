"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import VaultChart from "@/components/vault/VaultChart";
import SwapPanel from "@/components/vault/SwapPanel";
import { getVaultById } from "@/lib/vaultData";
import { Info, ArrowLeft } from "lucide-react";
import Link from "next/link";

const formatTvl = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
};

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vault = getVaultById(id);

  if (!vault) return notFound();

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <TopNavigation />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Breadcrumb + Header */}
        <div className="px-5 pt-4 pb-3">
          <Link
            href="/vault"
            className="flex items-center gap-1.5 text-[#5a5a6a] text-[12px] font-mono hover:text-white transition-colors mb-3"
          >
            <ArrowLeft size={13} /> Back to Pools
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {vault.assets.map((asset, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold border-2 border-black"
                  style={{ backgroundColor: asset.color, zIndex: vault.assets.length - i }}
                >
                  {asset.logo}
                </div>
              ))}
            </div>
            <div>
              <h1 className="text-white text-[22px] font-semibold">
                {vault.name}{" "}
                <span className="text-[#5a5a6a] text-[15px] font-normal">[{vault.pairLabel}]</span>
              </h1>
              <div className="flex items-center gap-4 mt-0.5">
                <span className="text-[#5a5a6a] text-[12px] font-mono">{vault.type} Pool</span>
                <span className="text-[#00c076] text-[12px] font-mono">
                  {vault.feeApy.toFixed(2)}% APY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout: Chart + SwapPanel */}
        <div className="flex gap-5 px-5 pb-5">
          {/* Left: Chart + Stats */}
          <div className="flex-1 min-w-0 space-y-5">
            <VaultChart vault={vault} />

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Value Locked", value: formatTvl(vault.tvl) },
                { label: "24h Volume", value: formatTvl(vault.volume24h) },
                { label: "Fee APY", value: `${vault.feeApy.toFixed(2)}%` },
                { label: "Ann. Performance", value: `${vault.annualPerformance.toFixed(2)}%`, green: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg p-4"
                >
                  <span className="text-[#5a5a6a] text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                    {stat.label} <Info size={9} />
                  </span>
                  <span
                    className={`text-[18px] font-mono font-semibold mt-1 block ${
                      stat.green ? "text-[#00c076]" : "text-white"
                    }`}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Additional Stats */}
            <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg p-5">
              <h3 className="text-white text-[14px] font-semibold mb-3">Pool Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between py-2 border-b border-[#1c1c28]">
                  <span className="text-[#5a5a6a] text-[12px] font-mono">Total Supply</span>
                  <span className="text-white text-[12px] font-mono">{vault.tvlSupply}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1c1c28]">
                  <span className="text-[#5a5a6a] text-[12px] font-mono">Utilization</span>
                  <span className="text-white text-[12px] font-mono">
                    {vault.utilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1c1c28]">
                  <span className="text-[#5a5a6a] text-[12px] font-mono">Fees Earned (24h)</span>
                  <span className="text-[#00c076] text-[12px] font-mono">
                    {formatTvl(vault.feesEarned)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1c1c28]">
                  <span className="text-[#5a5a6a] text-[12px] font-mono">Pool Type</span>
                  <span className="text-white text-[12px] font-mono">{vault.type}</span>
                </div>
              </div>

              {/* Composition */}
              <h4 className="text-white text-[13px] font-semibold mt-4 mb-2">Composition</h4>
              <div className="flex items-center gap-2 mb-2">
                {vault.composition.map((c) => (
                  <div
                    key={c.asset}
                    className="h-2 rounded-full"
                    style={{
                      width: `${c.percentage}%`,
                      backgroundColor: c.color,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4">
                {vault.composition.map((c) => (
                  <div key={c.asset} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-[#8a8a9a] text-[11px] font-mono">
                      {c.asset} {c.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p className="text-[#8a8a9a] text-[12px] font-mono leading-relaxed mt-4">
                {vault.description}
              </p>
            </div>
          </div>

          {/* Right: Swap Panel */}
          <div className="w-[320px] shrink-0">
            <SwapPanel vault={vault} />
          </div>
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

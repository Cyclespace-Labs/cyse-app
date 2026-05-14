"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import { useVaultPoolData } from "@/hooks/useVaultPoolData";
import { useStakingData } from "@/hooks/useStakingData";
import { useWallet } from "@/contexts/WalletContext";
import { formatUnits } from "viem";
import { Info, ArrowLeft, Loader2, ExternalLink, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";

const formatTvl = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
};

const TOKEN_META: Record<string, { logo: string; color: string }> = {
  eth: { logo: "E", color: "#627eea" },
  btc: { logo: "₿", color: "#f7931a" },
  usdc: { logo: "$", color: "#2775ca" },
  usdt: { logo: "₮", color: "#26a17b" },
};

const fmtNum = (v: number, d = 4) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: d });

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { wallet } = useWallet();
  const staking = useStakingData();
  const { pools, totalTvlUsd, isLoading } = useVaultPoolData();
  const pool = pools.find((item) => item.symbol.toLowerCase() === id.toLowerCase() || item.address.toLowerCase() === id.toLowerCase());

  if (!isLoading && !pool) return notFound();

  const tokenMeta = TOKEN_META[id.toLowerCase()] ?? { logo: "?", color: "#888" };
  const shareOfVault = pool && totalTvlUsd > 0 ? (pool.poolValueUsd / totalTvlUsd) * 100 : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <TopNavigation />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Breadcrumb + Header */}
        <div className="px-5 pt-4 pb-3">
          <Link
            href="/vault"
            className="flex items-center gap-1.5 text-[12px] font-mono transition-colors mb-3"
            style={{ color: "var(--on-surface-disabled)" }}
          >
            <ArrowLeft size={13} /> Back to Pools
          </Link>

          {isLoading || !pool ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--primary)" }} />
              <span className="text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Loading live pool data...</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold"
                style={{ backgroundColor: tokenMeta.color }}
              >
                {tokenMeta.logo}
              </div>
              <div>
                <h1 className="text-[22px] font-semibold" style={{ color: "var(--on-surface)" }}>
                  {pool.symbol}{" "}
                  <span className="text-[15px] font-normal" style={{ color: "var(--on-surface-disabled)" }}>[Vault Pool]</span>
                </h1>
                <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Live on-chain pool</span>
                  <span className="text-[12px] font-mono" style={{ color: "var(--buy)" }}>
                    {shareOfVault.toFixed(2)}% of vault TVL
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Layout: Chart + SwapPanel */}
        <div className="flex gap-5 px-5 pb-5">
          {/* Left: Chart + Stats */}
          <div className="flex-1 min-w-0 space-y-5">
            <div className="rounded-lg p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[16px] font-semibold" style={{ color: "var(--on-surface)" }}>Pool Overview</h3>
                  <p className="text-[12px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                    Live vault liquidity, utilization, and pricing for the selected token
                  </p>
                </div>
                <Link href="/vault" className="flex items-center gap-1 text-[11px] font-mono" style={{ color: "var(--primary)" }}>
                  Manage liquidity <ExternalLink size={11} />
                </Link>
              </div>

              {pool && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-2" style={{ color: "var(--on-surface-disabled)" }}>
                    <span>Share of vault TVL</span>
                    <span>{shareOfVault.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--surface-container)" }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.max(shareOfVault, 2)}%`, background: tokenMeta.color }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            {pool && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Value Locked", value: formatTvl(pool.poolValueUsd) },
                  { label: "Pool Amount", value: fmtNum(pool.poolAmountFormatted, 4) },
                  { label: "Min Price", value: `$${parseFloat(formatUnits(pool.minPrice, 30)).toFixed(4)}` },
                  { label: "Max Price", value: `$${parseFloat(formatUnits(pool.maxPrice, 30)).toFixed(4)}`, green: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg p-4"
                    style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--on-surface-disabled)" }}>
                      {stat.label} <Info size={9} />
                    </span>
                    <span
                      className="text-[18px] font-mono font-semibold mt-1 block"
                      style={{ color: stat.green ? "var(--buy)" : "var(--on-surface)" }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Stats */}
            {pool && (
              <div className="rounded-lg p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
                <h3 className="text-[14px] font-semibold mb-3" style={{ color: "var(--on-surface)" }}>Pool Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}>
                    <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Pool Address</span>
                    <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{`${pool.address.slice(0, 6)}...${pool.address.slice(-4)}`}</span>
                  </div>
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}>
                    <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Utilization</span>
                    <span className="text-[12px] font-mono" style={{ color: pool.utilization > 50 ? "var(--sell)" : pool.utilization > 25 ? "#f59e0b" : "var(--buy)" }}>
                      {pool.utilization.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}>
                    <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Reserved Liquidity</span>
                    <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>
                      {fmtNum(parseFloat(formatUnits(pool.reservedAmount, pool.decimals)), 4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}>
                    <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Available Liquidity</span>
                    <span className="text-[12px] font-mono" style={{ color: "var(--buy)" }}>{fmtNum(pool.availableLiquidity, 4)}</span>
                  </div>
                </div>

                {/* Composition */}
                <h4 className="text-[13px] font-semibold mt-4 mb-2" style={{ color: "var(--on-surface)" }}>Composition</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.max(shareOfVault, 4)}%`, backgroundColor: tokenMeta.color }} />
                  <div className="h-2 rounded-full flex-1" style={{ backgroundColor: "var(--surface-container)" }} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tokenMeta.color }} />
                    <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
                      {pool.symbol} {shareOfVault.toFixed(1)}% of vault TVL
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[12px] font-mono leading-relaxed mt-4" style={{ color: "var(--on-surface-disabled)" }}>
                  This page reflects live on-chain vault accounting for the selected token, including liquidity, reserved utilization, and min/max pricing from the core vault contracts.
                </p>
              </div>
            )}
          </div>

          {/* Right: Swap Panel */}
          <div className="w-[320px] shrink-0">
            <div className="rounded-lg p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={16} style={{ color: "var(--primary)" }} />
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--on-surface)" }}>Your Position</h3>
              </div>

              <div className="space-y-3 text-[12px] font-mono">
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Connected</span>
                  <span style={{ color: wallet.connected ? "var(--buy)" : "var(--sell)" }}>{wallet.connected ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Unstaked CYLP</span>
                  <span style={{ color: "var(--on-surface)" }}>{fmtNum(staking.cylpBalance, 4)}</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Staked CYLP</span>
                  <span style={{ color: "var(--on-surface)" }}>{fmtNum(staking.stakedCylpAmount, 4)}</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Claimable ETH</span>
                  <span style={{ color: "var(--buy)" }}>{fmtNum(staking.totalClaimableEth, 6)} ETH</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Claimable esCYSE</span>
                  <span style={{ color: "var(--on-surface)" }}>{fmtNum(staking.totalClaimableEsCyse, 4)}</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Claimable CYSE</span>
                  <span style={{ color: "var(--on-surface)" }}>{fmtNum(staking.totalClaimableCyse, 4)}</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: "var(--on-surface-disabled)" }}>
                  <span>Staked CYLP Value</span>
                  <span style={{ color: "var(--on-surface)" }}>{formatTvl(staking.cylpStakeValueUsd)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Link href="/vault" className="flex items-center justify-center gap-1 w-full py-2 rounded text-[11px] font-mono font-semibold" style={{ background: "var(--primary)", color: "#fff" }}>
                  Manage Liquidity <ExternalLink size={11} />
                </Link>
                <Link href="/earn" className="flex items-center justify-center gap-1 w-full py-2 rounded text-[11px] font-mono font-semibold" style={{ border: "1px solid rgba(66,70,84,0.4)", color: "var(--on-surface)" }}>
                  Manage Rewards <TrendingUp size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

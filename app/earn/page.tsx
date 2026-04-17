"use client";

import { useState } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import DiscoverSection from "@/components/earn/DiscoverSection";
import {
  infoCards,
  faqItems,
  yieldLandscape,
} from "@/lib/earnData";
import {
  Wallet,
  TrendingUp,
  Gift,
  Layers,
  Droplets,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useStakingData } from "@/hooks/useStakingData";
import { useStakingActions } from "@/hooks/useStakingActions";
import { useVaultPoolData } from "@/hooks/useVaultPoolData";

const earnTabs = ["Portfolio", "Discover", "Distributions"];

const fmtNum = (v: number, d = 4) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: d });

const fmt$ = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
};

export default function EarnPage() {
  const { wallet, CustomConnectButton } = useWallet();
  const staking = useStakingData();
  const actions = useStakingActions();
  const { totalTvlUsd } = useVaultPoolData();

  const [activeTab, setActiveTab] = useState("Portfolio");
  const [stakeInput, setStakeInput] = useState("");
  const [unstakeInput, setUnstakeInput] = useState("");
  const [stakeTab, setStakeTab] = useState<"stake" | "unstake">("stake");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleStake = async () => {
    if (!stakeInput || parseFloat(stakeInput) <= 0) return;
    setTxStatus("Staking CYSE...");
    try {
      await actions.stakeCyse(stakeInput);
      setTxStatus("CYSE staked successfully!");
      setStakeInput("");
    } catch (e: any) {
      setTxStatus(`Error: ${e.shortMessage || e.message}`);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeInput || parseFloat(unstakeInput) <= 0) return;
    setTxStatus("Unstaking CYSE...");
    try {
      await actions.unstakeCyse(unstakeInput);
      setTxStatus("CYSE unstaked successfully!");
      setUnstakeInput("");
    } catch (e: any) {
      setTxStatus(`Error: ${e.shortMessage || e.message}`);
    }
  };

  const handleClaim = async () => {
    setTxStatus("Claiming rewards...");
    try {
      await actions.claimRewards();
      setTxStatus("Rewards claimed!");
    } catch (e: any) {
      setTxStatus(`Error: ${e.shortMessage || e.message}`);
    }
  };

  const handleCompound = async () => {
    setTxStatus("Compounding...");
    try {
      await actions.compound();
      setTxStatus("Compounded successfully!");
    } catch (e: any) {
      setTxStatus(`Error: ${e.shortMessage || e.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <TopNavigation />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Page Header */}
        <div className="px-5 pt-5 pb-2">
          <h1 className="text-[26px] font-semibold" style={{ color: "var(--on-surface)" }}>Earn</h1>
          <p className="text-[13px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
            Stake CYSE and provide vault liquidity to earn protocol fees
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pb-3">
          {earnTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 text-[12px] font-mono rounded transition-colors"
              style={{
                background: activeTab === tab ? "var(--primary)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--on-surface-muted)",
                fontWeight: activeTab === tab ? 500 : undefined,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-5 py-3" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)", background: "var(--surface-container-lowest)" }}>
          <EarnStat label="Vault TVL" value={fmt$(totalTvlUsd)} icon={<Droplets size={12} />} />
          <EarnStat label="Staked CYSE" value={wallet.connected ? fmtNum(staking.stakedCyseAmount, 2) : "-"} icon={<Layers size={12} />} />
          <EarnStat label="Claimable ETH" value={wallet.connected ? `${fmtNum(staking.totalClaimableEth, 6)}` : "-"} icon={<TrendingUp size={12} />} accent />
          <EarnStat label="Claimable esCYSE" value={wallet.connected ? fmtNum(staking.totalClaimableEsCyse, 2) : "-"} icon={<Gift size={12} />} />
          {wallet.connected && (staking.totalClaimableEth > 0 || staking.totalClaimableEsCyse > 0) && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleCompound}
                disabled={actions.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono rounded transition-colors"
                style={{ border: "1px solid rgba(66,70,84,0.4)", color: "var(--on-surface-muted)" }}
              >
                <RefreshCw size={11} /> Compound
              </button>
              <button
                onClick={handleClaim}
                disabled={actions.isPending}
                className="px-4 py-1.5 text-[11px] font-mono font-semibold rounded transition-colors"
                style={{ background: "var(--buy)", color: "#fff" }}
              >
                Claim All
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === "Portfolio" && (
            <>
              {/* Stake / Unstake CYSE */}
              <div className="px-5 py-5">
                <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
                  <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
                    <div>
                      <h2 className="text-[16px] font-semibold" style={{ color: "var(--on-surface)" }}>CYSE Staking</h2>
                      <p className="text-[12px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                        Stake CYSE to earn ETH fees and esCYSE rewards
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setStakeTab("stake")}
                        className="px-3 py-1.5 text-[11px] font-mono rounded transition-colors"
                        style={{
                          background: stakeTab === "stake" ? "var(--primary)" : "transparent",
                          color: stakeTab === "stake" ? "#fff" : "var(--on-surface-disabled)",
                        }}
                      >
                        Stake
                      </button>
                      <button
                        onClick={() => setStakeTab("unstake")}
                        className="px-3 py-1.5 text-[11px] font-mono rounded transition-colors"
                        style={{
                          background: stakeTab === "unstake" ? "var(--sell)" : "transparent",
                          color: stakeTab === "unstake" ? "#fff" : "var(--on-surface-disabled)",
                        }}
                      >
                        Unstake
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    {!wallet.connected ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Wallet size={28} className="mb-3" style={{ color: "var(--on-surface-disabled)" }} />
                        <p className="text-[13px] font-mono mb-4" style={{ color: "var(--on-surface-disabled)" }}>
                          Connect wallet to stake CYSE
                        </p>
                        <CustomConnectButton />
                      </div>
                    ) : stakeTab === "stake" ? (
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>
                            CYSE Amount
                          </label>
                          <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)" }}>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={stakeInput}
                              onChange={(e) => setStakeInput(e.target.value)}
                              placeholder="0"
                              className="flex-1 bg-transparent text-[14px] font-mono outline-none"
                              style={{ color: "var(--on-surface)" }}
                            />
                            <button
                              onClick={() => setStakeInput(staking.cyseBalance.toString())}
                              className="text-[10px] font-mono px-2 py-0.5 rounded"
                              style={{ color: "var(--primary)", background: "rgba(14,118,253,0.1)" }}
                            >
                              MAX
                            </button>
                          </div>
                          <div className="text-[10px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                            Available: {fmtNum(staking.cyseBalance, 2)} CYSE
                          </div>
                        </div>
                        <button
                          onClick={handleStake}
                          disabled={actions.isPending || !stakeInput}
                          className="px-5 py-2.5 text-[12px] font-mono font-semibold rounded transition-colors disabled:opacity-40"
                          style={{ background: "var(--primary)", color: "#fff" }}
                        >
                          {actions.isPending ? "Processing..." : "Stake CYSE"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>
                            CYSE Amount
                          </label>
                          <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)" }}>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={unstakeInput}
                              onChange={(e) => setUnstakeInput(e.target.value)}
                              placeholder="0"
                              className="flex-1 bg-transparent text-[14px] font-mono outline-none"
                              style={{ color: "var(--on-surface)" }}
                            />
                            <button
                              onClick={() => setUnstakeInput(staking.stakedCyseAmount.toString())}
                              className="text-[10px] font-mono px-2 py-0.5 rounded"
                              style={{ color: "var(--sell)", background: "rgba(255,77,79,0.1)" }}
                            >
                              MAX
                            </button>
                          </div>
                          <div className="text-[10px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                            Staked: {fmtNum(staking.stakedCyseAmount, 2)} CYSE
                          </div>
                        </div>
                        <button
                          onClick={handleUnstake}
                          disabled={actions.isPending || !unstakeInput}
                          className="px-5 py-2.5 text-[12px] font-mono font-semibold rounded transition-colors disabled:opacity-40"
                          style={{ background: "var(--sell)", color: "#fff" }}
                        >
                          {actions.isPending ? "Processing..." : "Unstake CYSE"}
                        </button>
                      </div>
                    )}

                    {txStatus && (
                      <div className="mt-3 text-[11px] font-mono px-3 py-2 rounded" style={{
                        background: txStatus.startsWith("Error") ? "rgba(255,77,79,0.1)" : "rgba(0,192,118,0.1)",
                        color: txStatus.startsWith("Error") ? "var(--sell)" : "var(--buy)",
                      }}>
                        {txStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* My Assets — Live */}
              <div className="px-5 pb-5">
                <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>My Assets</h2>
                {!wallet.connected ? (
                  <div className="flex flex-col items-center justify-center py-16 rounded-lg" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
                    <Wallet size={32} className="mb-3" style={{ color: "var(--on-surface-disabled)" }} />
                    <p className="text-[13px] font-mono mb-4" style={{ color: "var(--on-surface-disabled)" }}>
                      Connect wallet to see your assets
                    </p>
                    <CustomConnectButton />
                  </div>
                ) : staking.isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
                    <div className="grid grid-cols-5 gap-0 text-[10px] font-mono uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
                      <span>Asset</span><span>Balance</span><span>Staked</span><span>Claimable</span><span>Status</span>
                    </div>

                    {/* CYSE */}
                    <AssetRow
                      logo="C" color="var(--primary)" name="CYSE"
                      balance={fmtNum(staking.cyseBalance, 2)}
                      staked={fmtNum(staking.stakedCyseAmount, 2)}
                      claimable={`${fmtNum(staking.totalClaimableEsCyse, 4)} esCYSE`}
                      status={staking.stakedCyseAmount > 0 ? "Earning" : "Not staked"}
                      statusColor={staking.stakedCyseAmount > 0 ? "var(--buy)" : "var(--on-surface-disabled)"}
                    />

                    {/* esCYSE */}
                    <AssetRow
                      logo="E" color="#6366f1" name="esCYSE"
                      balance={fmtNum(staking.esCyseClaimable, 4)}
                      staked="-"
                      claimable="-"
                      status="Vesting"
                      statusColor="#f59e0b"
                    />

                    {/* CYLP */}
                    <AssetRow
                      logo="L" color="#06b6d4" name="CYLP"
                      balance={fmtNum(staking.cylpBalance, 4)}
                      staked={fmtNum(staking.stakedCylpAmount, 4)}
                      claimable={`${fmtNum(staking.feeCylpClaimable, 6)} ETH`}
                      status={staking.stakedCylpAmount > 0 ? "Earning fees" : "Unstaked"}
                      statusColor={staking.stakedCylpAmount > 0 ? "var(--buy)" : "var(--on-surface-disabled)"}
                    />

                    {/* Fee CYSE tracker (WETH rewards) */}
                    <AssetRow
                      logo="F" color="#627eea" name="ETH Fees (CYSE)"
                      balance="-"
                      staked={fmtNum(staking.feeCyseStaked, 2)}
                      claimable={`${fmtNum(staking.feeCyseClaimable, 6)} ETH`}
                      status={staking.feeCyseClaimable > 0 ? "Claimable" : "-"}
                      statusColor={staking.feeCyseClaimable > 0 ? "var(--buy)" : "var(--on-surface-disabled)"}
                      isLast
                    />
                  </div>
                )}
              </div>

              {/* Reward Breakdown */}
              {wallet.connected && !staking.isLoading && (
                <div className="px-5 pb-6">
                  <div className="rounded-lg p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
                    <h3 className="text-[14px] font-semibold mb-3" style={{ color: "var(--on-surface)" }}>Reward Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <RewardItem label="ETH from CYSE staking" value={`${fmtNum(staking.feeCyseClaimable, 6)} ETH`} />
                      <RewardItem label="ETH from CYLP fees" value={`${fmtNum(staking.feeCylpClaimable, 6)} ETH`} />
                      <RewardItem label="esCYSE from staking" value={`${fmtNum(staking.totalClaimableEsCyse, 4)} esCYSE`} />
                      <RewardItem label="Bonus CYSE tracker" value={`${fmtNum(staking.bonusCyseAmount, 4)}`} />
                      <RewardItem label="CYLP total supply" value={fmtNum(staking.cylpSupply, 2)} />
                      <RewardItem label="Total claimable ETH" value={`${fmtNum(staking.totalClaimableEth, 6)} ETH`} accent />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "Discover" && (
            <DiscoverSection
              infoCards={infoCards}
              faqItems={faqItems}
              yieldLandscape={yieldLandscape}
            />
          )}

          {activeTab === "Distributions" && (
            <div className="flex items-center justify-center py-20 text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Distribution history will appear here
            </div>
          )}
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function EarnStat({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <span style={{ color: accent ? "var(--buy)" : "var(--on-surface-disabled)" }}>{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: accent ? "var(--buy)" : "var(--on-surface-disabled)" }}>
          {label}
        </span>
      </div>
      <span className="text-[15px] font-mono font-semibold" style={{ color: accent ? "var(--buy)" : "var(--on-surface)" }}>
        {value}
      </span>
    </div>
  );
}

function AssetRow({ logo, color, name, balance, staked, claimable, status, statusColor, isLast }: {
  logo: string; color: string; name: string; balance: string; staked: string; claimable: string; status: string; statusColor: string; isLast?: boolean;
}) {
  return (
    <div className="grid grid-cols-5 items-center px-4 py-3" style={{ borderBottom: isLast ? "none" : "1px solid rgba(66,70,84,0.2)" }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>{logo}</div>
        <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{name}</span>
      </div>
      <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{balance}</span>
      <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{staked}</span>
      <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{claimable}</span>
      <span className="text-[12px] font-mono" style={{ color: statusColor }}>{status}</span>
    </div>
  );
}

function RewardItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(66,70,84,0.15)" }}>
      <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>{label}</span>
      <span className="text-[12px] font-mono font-medium" style={{ color: accent ? "var(--buy)" : "var(--on-surface)" }}>{value}</span>
    </div>
  );
}

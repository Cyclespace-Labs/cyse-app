"use client";

import { useState } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import { useVaultPoolData, VaultTokenPool } from "@/hooks/useVaultPoolData";
import { useStakingData } from "@/hooks/useStakingData";
import { useStakingActions } from "@/hooks/useStakingActions";
import { useWallet } from "@/contexts/WalletContext";
import { contracts } from "@/lib/protocol/contracts";
import { Loader2, Droplets, ShieldCheck, TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, Clock, ExternalLink } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import Link from "next/link";

const fmt$ = (v: number) => {
  return `$${Math.floor(v).toLocaleString("en-US")}`;
};

const fmtNum = (v: number, d = 4) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: d });

// Slippage tolerance: 0.5% (50 basis points) for USDG/output
// For CYLP minting, use 0 since output depends on vault AUM and supply ratio
const SLIPPAGE_BPS = 50;
const calculateSlippage = (value: bigint) => {
  return (value * (10000n - BigInt(SLIPPAGE_BPS))) / 10000n;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    if ("shortMessage" in error && typeof error.shortMessage === "string") {
      return error.shortMessage;
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }

  return "Unknown error";
};

const TOKEN_COLORS: Record<string, string> = {
  ETH: "#627eea", BTC: "#f7931a", USDC: "#2775ca", USDT: "#26a17b",
};
const TOKEN_LOGOS: Record<string, string> = {
  ETH: "E", BTC: "₿", USDC: "$", USDT: "₮",
};

interface ERC20Token { symbol: string; address: `0x${string}`; decimals: number; }
interface RedeemToken { symbol: string; address: `0x${string}`; }

// Supported ERC-20 deposit tokens (add liquidity via token, not ETH)
const ERC20_TOKENS: ERC20Token[] = [
  { symbol: "WETH", address: contracts.weth.address, decimals: 18 },
  { symbol: "BTC",  address: contracts.btc.address,  decimals: 18 },
  { symbol: "USDC", address: contracts.usdc.address, decimals: 18 },
  { symbol: "USDT", address: contracts.usdt.address, decimals: 18 },
];

// Supported ERC-20 redeem tokens (remove liquidity to token, not ETH)
const REDEEM_TOKENS: RedeemToken[] = [
  { symbol: "WETH", address: contracts.weth.address },
  { symbol: "BTC",  address: contracts.btc.address  },
  { symbol: "USDC", address: contracts.usdc.address },
  { symbol: "USDT", address: contracts.usdt.address },
];

export default function VaultPage() {
  const { pools, totalTvlUsd, isLoading } = useVaultPoolData();
  const staking = useStakingData();
  const actions = useStakingActions();
  const { wallet } = useWallet();

  const [addLiqInput, setAddLiqInput] = useState("");
  const [removeLiqInput, setRemoveLiqInput] = useState("");
  const [liqTab, setLiqTab] = useState<"add" | "remove">("add");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Add liquidity: ETH (native) vs ERC-20 token
  const [addTokenMode, setAddTokenMode] = useState<"eth" | "token">("eth");
  const [selectedAddToken, setSelectedAddToken] = useState<ERC20Token>(ERC20_TOKENS[0]);

  // Remove liquidity: receive ETH vs ERC-20 token
  const [removeTokenMode, setRemoveTokenMode] = useState<"eth" | "token">("eth");
  const [selectedRemoveToken, setSelectedRemoveToken] = useState<RedeemToken>(REDEEM_TOKENS[0]);

  const handleAddLiquidity = async () => {
    if (!addLiqInput || parseFloat(addLiqInput) <= 0) return;
    setTxStatus("Adding liquidity...");
    try {
      if (addTokenMode === "eth") {
        const ethAmount = parseUnits(addLiqInput, 18);
        // Calculate slippage: 0.5% tolerance for USDG output
        // CYLP output depends on vault AUM/supply ratio, so use 0 as minimum
        const minUsdg = calculateSlippage(ethAmount);
        const minCylp = 0n;
        await actions.addLiquidityETH(addLiqInput, { minUsdg, minCylp });
      } else {
        const tokenAmount = parseUnits(addLiqInput, selectedAddToken.decimals);
        // Calculate slippage: 0.5% tolerance for USDG output
        // CYLP output depends on vault AUM/supply ratio, so use 0 as minimum
        const minUsdg = calculateSlippage(tokenAmount);
        const minCylp = 0n;
        await actions.addLiquidityToken(selectedAddToken.address, addLiqInput, selectedAddToken.decimals, { minUsdg, minCylp });
      }
      setTxStatus("Liquidity added! CYLP minted and staked.");
      setAddLiqInput("");
    } catch (error: unknown) {
      setTxStatus(`Error: ${getErrorMessage(error)}`);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeLiqInput || parseFloat(removeLiqInput) <= 0) return;
    setTxStatus("Removing liquidity...");
    try {
      const cylpAmount = parseUnits(removeLiqInput, 18);
      // Calculate slippage: 0.5% tolerance for output token
      const minOut = calculateSlippage(cylpAmount);
      
      if (removeTokenMode === "eth") {
        await actions.removeLiquidityETH(removeLiqInput, { minOut });
      } else {
        await actions.removeLiquidityToken(selectedRemoveToken.address, removeLiqInput, { minOut });
      }
      setTxStatus("Liquidity removed!");
      setRemoveLiqInput("");
    } catch (error: unknown) {
      setTxStatus(`Error: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <TopNavigation />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* TVL Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Droplets size={28} style={{ color: "var(--primary)" }} />
            <div>
              <h1 className="text-[32px] font-semibold font-mono tracking-tight" style={{ color: "var(--on-surface)" }}>
                {isLoading ? "..." : fmt$(totalTvlUsd)}
              </h1>
              <p className="text-[13px] font-mono mt-0.5" style={{ color: "var(--on-surface-disabled)" }}>
                Total Value Locked in Vault
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 px-5 pb-5">
          <StatCard label="Whitelisted Tokens" value={`${pools.length}`} icon={<ShieldCheck size={14} />} />
          <StatCard label="CYLP Supply" value={fmtNum(staking.cylpSupply, 2)} icon={<Droplets size={14} />} />
          <StatCard label="CYLP Price" value={staking.cylpPrice > 0 ? `$${staking.cylpPrice.toFixed(4)}` : "-"} icon={<TrendingUp size={14} />} />
          <StatCard label="Your CYLP" value={wallet.connected ? fmtNum(staking.cylpBalance + staking.stakedCylpAmount, 4) : "-"} icon={<Wallet size={14} />} />
          <StatCard label="Claimable ETH Fees" value={wallet.connected ? `${fmtNum(staking.totalClaimableEth, 6)} ETH` : "-"} icon={<TrendingUp size={14} />} accent />
        </div>

        {wallet.connected && (
          <div className="grid grid-cols-3 gap-4 px-5 pb-5">
            <StatCard label="Staked CYLP Value" value={fmt$(staking.cylpStakeValueUsd)} icon={<Droplets size={14} />} />
            <StatCard label="Claimable CYSE" value={`${fmtNum(staking.totalClaimableCyse, 4)} CYSE`} icon={<TrendingUp size={14} />} />
            <StatCard label="Claimable esCYSE" value={`${fmtNum(staking.totalClaimableEsCyse, 4)} esCYSE`} icon={<TrendingUp size={14} />} />
          </div>
        )}

        {/* Pool Breakdown */}
        <div className="px-5 pb-5">
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--on-surface)" }}>Vault Pool Breakdown</h2>
              <p className="text-[12px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                Live on-chain liquidity backing all perpetual markets
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
              </div>
            ) : pools.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
                No whitelisted tokens found in vault
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
                    <th className="text-left px-5 py-3 font-normal">Token</th>
                    <th className="text-right px-4 py-3 font-normal">Pool Amount</th>
                    <th className="text-right px-4 py-3 font-normal">Value (USD)</th>
                    <th className="text-right px-4 py-3 font-normal">Min Price</th>
                    <th className="text-right px-4 py-3 font-normal">Max Price</th>
                    <th className="text-right px-4 py-3 font-normal">Reserved</th>
                    <th className="text-right px-4 py-3 font-normal">Utilization</th>
                    <th className="text-right px-4 py-3 font-normal">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <PoolRow key={pool.address} pool={pool} totalTvl={totalTvlUsd} />
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
                    <td className="px-5 py-3 text-[13px] font-mono font-semibold" style={{ color: "var(--on-surface)" }}>Total</td>
                    <td />
                    <td className="text-right px-4 py-3 text-[13px] font-mono font-semibold" style={{ color: "var(--on-surface)" }}>{fmt$(totalTvlUsd)}</td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Add / Remove Liquidity */}
        <div className="px-5 pb-5">
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
              <div>
                <h2 className="text-[16px] font-semibold" style={{ color: "var(--on-surface)" }}>Vault Liquidity (CYLP)</h2>
                <p className="text-[12px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                  Deposit tokens to mint &amp; auto-stake CYLP · earn ETH fees and esCYSE
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLiqTab("add")}
                  className="px-3 py-1.5 text-[11px] font-mono rounded transition-colors"
                  style={{
                    background: liqTab === "add" ? "var(--primary)" : "transparent",
                    color: liqTab === "add" ? "#fff" : "var(--on-surface-disabled)",
                  }}
                >
                  <ArrowUpRight size={12} className="inline mr-1" />Add
                </button>
                <button
                  onClick={() => setLiqTab("remove")}
                  className="px-3 py-1.5 text-[11px] font-mono rounded transition-colors"
                  style={{
                    background: liqTab === "remove" ? "var(--sell)" : "transparent",
                    color: liqTab === "remove" ? "#fff" : "var(--on-surface-disabled)",
                  }}
                >
                  <ArrowDownLeft size={12} className="inline mr-1" />Remove
                </button>
              </div>
            </div>

            <div className="p-5">
              {!wallet.connected ? (
                <div className="text-center py-8 text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
                  Connect wallet to manage vault liquidity
                </div>
              ) : liqTab === "add" ? (
                <div className="space-y-3">
                  {/* Token mode selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--on-surface-disabled)" }}>Deposit via</span>
                    <button
                      onClick={() => setAddTokenMode("eth")}
                      className="px-2.5 py-1 text-[11px] font-mono rounded transition-colors"
                      style={{
                        background: addTokenMode === "eth" ? "var(--primary)" : "var(--surface-container)",
                        color: addTokenMode === "eth" ? "#fff" : "var(--on-surface-muted)",
                        border: "1px solid rgba(66,70,84,0.4)",
                      }}
                    >
                      ETH (native)
                    </button>
                    <button
                      onClick={() => setAddTokenMode("token")}
                      className="px-2.5 py-1 text-[11px] font-mono rounded transition-colors"
                      style={{
                        background: addTokenMode === "token" ? "var(--primary)" : "var(--surface-container)",
                        color: addTokenMode === "token" ? "#fff" : "var(--on-surface-muted)",
                        border: "1px solid rgba(66,70,84,0.4)",
                      }}
                    >
                      ERC-20 Token
                    </button>
                    {addTokenMode === "token" && (
                      <select
                        value={selectedAddToken.symbol}
                        onChange={(e) => {
                          const t = ERC20_TOKENS.find((x) => x.symbol === e.target.value);
                          if (t) setSelectedAddToken(t);
                        }}
                        className="px-2 py-1 text-[11px] font-mono rounded"
                        style={{ background: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid rgba(66,70,84,0.4)" }}
                      >
                        {ERC20_TOKENS.map((t) => (
                          <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>
                        {addTokenMode === "eth" ? "ETH Amount" : `${selectedAddToken.symbol} Amount`}
                      </label>
                      <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)" }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={addLiqInput}
                          onChange={(e) => setAddLiqInput(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-[14px] font-mono outline-none"
                          style={{ color: "var(--on-surface)" }}
                        />
                        <span className="text-[12px] font-mono ml-2" style={{ color: "var(--on-surface-disabled)" }}>
                          {addTokenMode === "eth" ? "ETH" : selectedAddToken.symbol}
                        </span>
                      </div>
                      {addTokenMode === "eth" && (
                        <div className="text-[10px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                          Balance: {fmtNum(wallet.balance, 4)} ETH
                        </div>
                      )}
                      {staking.cylpPrice > 0 && addLiqInput && parseFloat(addLiqInput) > 0 && (
                        <div className="text-[10px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                          CYLP Price: ${staking.cylpPrice.toFixed(4)} per CYLP
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddLiquidity}
                      disabled={actions.isPending || !addLiqInput}
                      className="px-5 py-2.5 text-[12px] font-mono font-semibold rounded transition-colors disabled:opacity-40"
                      style={{ background: "var(--primary)", color: "#fff" }}
                    >
                      {actions.isPending ? "Processing..." : "Add Liquidity"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Receive mode selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--on-surface-disabled)" }}>Receive as</span>
                    <button
                      onClick={() => setRemoveTokenMode("eth")}
                      className="px-2.5 py-1 text-[11px] font-mono rounded transition-colors"
                      style={{
                        background: removeTokenMode === "eth" ? "var(--sell)" : "var(--surface-container)",
                        color: removeTokenMode === "eth" ? "#fff" : "var(--on-surface-muted)",
                        border: "1px solid rgba(66,70,84,0.4)",
                      }}
                    >
                      ETH (native)
                    </button>
                    <button
                      onClick={() => setRemoveTokenMode("token")}
                      className="px-2.5 py-1 text-[11px] font-mono rounded transition-colors"
                      style={{
                        background: removeTokenMode === "token" ? "var(--sell)" : "var(--surface-container)",
                        color: removeTokenMode === "token" ? "#fff" : "var(--on-surface-muted)",
                        border: "1px solid rgba(66,70,84,0.4)",
                      }}
                    >
                      ERC-20 Token
                    </button>
                    {removeTokenMode === "token" && (
                      <select
                        value={selectedRemoveToken.symbol}
                        onChange={(e) => {
                          const t = REDEEM_TOKENS.find((x) => x.symbol === e.target.value);
                          if (t) setSelectedRemoveToken(t);
                        }}
                        className="px-2 py-1 text-[11px] font-mono rounded"
                        style={{ background: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid rgba(66,70,84,0.4)" }}
                      >
                        {REDEEM_TOKENS.map((t) => (
                          <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>
                        CYLP Amount
                      </label>
                      <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)" }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={removeLiqInput}
                          onChange={(e) => setRemoveLiqInput(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-[14px] font-mono outline-none"
                          style={{ color: "var(--on-surface)" }}
                        />
                        <button
                          onClick={() => setRemoveLiqInput((staking.stakedCylpAmount + staking.cylpBalance).toString())}
                          className="text-[10px] font-mono px-2 py-0.5 rounded ml-1"
                          style={{ color: "var(--sell)", background: "rgba(255,77,79,0.1)" }}
                        >
                          MAX
                        </button>
                        <span className="text-[12px] font-mono ml-2" style={{ color: "var(--on-surface-disabled)" }}>CYLP</span>
                      </div>
                      <div className="text-[10px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                        Your CYLP: {fmtNum(staking.stakedCylpAmount + staking.cylpBalance, 4)}
                        {staking.cylpPrice > 0 && removeLiqInput && parseFloat(removeLiqInput) > 0
                          ? ` · ≈ $${(parseFloat(removeLiqInput) * staking.cylpPrice).toFixed(2)}`
                          : ""}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveLiquidity}
                      disabled={actions.isPending || !removeLiqInput}
                      className="px-5 py-2.5 text-[12px] font-mono font-semibold rounded transition-colors disabled:opacity-40"
                      style={{ background: "var(--sell)", color: "#fff" }}
                    >
                      {actions.isPending ? "Processing..." : "Remove Liquidity"}
                    </button>
                  </div>
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

        {/* CYLP Vesting Summary — links to Earn page */}
        {wallet.connected && (
          <div className="px-5 pb-6">
            <div className="rounded-lg p-5" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: "#06b6d4" }} />
                  <h3 className="text-[14px] font-semibold" style={{ color: "var(--on-surface)" }}>CYLP Vesting (CylpVester)</h3>
                </div>
                <Link href="/earn" className="flex items-center gap-1 text-[11px] font-mono" style={{ color: "var(--primary)" }}>
                  Manage on Earn <ExternalLink size={11} />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <VestMini label="esCYSE Deposited" value={`${fmtNum(staking.cylpVesting.deposited, 4)}`} />
                <VestMini label="CYSE Claimable" value={`${fmtNum(staking.cylpVesting.claimable, 4)}`} accent />
                <VestMini label="Max Vestable" value={`${fmtNum(staking.cylpVesting.maxVestable, 4)}`} />
                <VestMini label="Pair Locked (sCylp)" value={`${fmtNum(staking.cylpVesting.pairAmount, 4)}`} />
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomTicker />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: accent ? "var(--buy)" : "var(--on-surface-disabled)" }}>{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--on-surface-disabled)" }}>{label}</span>
      </div>
      <span className="text-[16px] font-mono font-semibold" style={{ color: accent ? "var(--buy)" : "var(--on-surface)" }}>{value}</span>
    </div>
  );
}

function PoolRow({ pool, totalTvl }: { pool: VaultTokenPool; totalTvl: number }) {
  const priceFmt = (v: bigint) => {
    const n = parseFloat(formatUnits(v, 30));
    return n >= 1 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;
  };

  const pct = totalTvl > 0 ? (pool.poolValueUsd / totalTvl) * 100 : 0;
  const color = TOKEN_COLORS[pool.symbol] ?? "#888";

  return (
    <tr className="transition-colors" style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: color }}>
            {TOKEN_LOGOS[pool.symbol] ?? "?"}
          </div>
          <div>
            <Link href={`/vault/${pool.symbol.toLowerCase()}`} className="text-[13px] font-mono font-medium hover:underline" style={{ color: "var(--on-surface)" }}>
              {pool.symbol}
            </Link>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1 rounded-full" style={{ width: `${Math.max(pct, 4)}px`, maxWidth: 60, background: color }} />
              <span className="text-[9px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>{pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </td>
      <td className="text-right px-4 py-3 text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{fmtNum(pool.poolAmountFormatted, 4)}</td>
      <td className="text-right px-4 py-3 text-[12px] font-mono font-medium" style={{ color: "var(--on-surface)" }}>{fmt$(pool.poolValueUsd)}</td>
      <td className="text-right px-4 py-3 text-[12px] font-mono" style={{ color: "var(--on-surface-muted)" }}>{priceFmt(pool.minPrice)}</td>
      <td className="text-right px-4 py-3 text-[12px] font-mono" style={{ color: "var(--on-surface-muted)" }}>{priceFmt(pool.maxPrice)}</td>
      <td className="text-right px-4 py-3 text-[12px] font-mono" style={{ color: "var(--on-surface-muted)" }}>{fmtNum(parseFloat(formatUnits(pool.reservedAmount, pool.decimals)), 4)}</td>
      <td className="text-right px-4 py-3">
        <span className="text-[12px] font-mono" style={{ color: pool.utilization > 50 ? "var(--sell)" : pool.utilization > 25 ? "#f59e0b" : "var(--buy)" }}>
          {pool.utilization.toFixed(1)}%
        </span>
      </td>
      <td className="text-right px-4 py-3 text-[12px] font-mono" style={{ color: "var(--buy)" }}>{fmtNum(pool.availableLiquidity, 4)}</td>
    </tr>
  );
}

function VestMini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded px-3 py-2" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.3)" }}>
      <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--on-surface-disabled)" }}>{label}</div>
      <div className="text-[13px] font-mono font-semibold" style={{ color: accent ? "var(--buy)" : "var(--on-surface)" }}>{value}</div>
    </div>
  );
}

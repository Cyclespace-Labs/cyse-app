"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useReadContract, useBalance } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { ArrowUpDown, ChevronDown, Loader2, X } from "lucide-react";
import { contracts, erc20Abi } from "@/lib/protocol/contracts";
import { PlaceSwapParams } from "@/hooks/useTradingActions";
import { Input } from "@base-ui/react/input";

const SWAP_TOKENS = {
  WETH: { address: contracts.weth.address, decimals: 18, symbol: "ETH",  name: "Ethereum" },
  BTC:  { address: contracts.btc.address,  decimals: 8,  symbol: "BTC",  name: "Bitcoin" },
  USDC: { address: contracts.usdc.address, decimals: 6,  symbol: "USDC", name: "USD Coin" },
  USDT: { address: contracts.usdt.address, decimals: 6,  symbol: "USDT", name: "Tether" },
} as const;

const TOKEN_ICONS: Record<string, string> = {
  WETH: "/tokens/Ethereum ETH.svg",
  BTC:  "/tokens/Bitcoin.svg",
  USDC: "/tokens/USD Coin.svg",
  USDT: "/tokens/Tether.svg",
};

type SwapTokenKey = keyof typeof SWAP_TOKENS;
const ALL_SWAP_TOKENS = Object.keys(SWAP_TOKENS) as SwapTokenKey[];
const STABLE_TOKENS = new Set<SwapTokenKey>(["USDC", "USDT"]);

const PRICE_PRECISION_EXP = 30;

function getFeeBps(fromKey: SwapTokenKey, toKey: SwapTokenKey): number {
  if (STABLE_TOKENS.has(fromKey) && STABLE_TOKENS.has(toKey)) return 4;
  return 30;
}

const SLIPPAGE_OPTIONS = [10, 30, 50, 100];

interface SwapPanelProps {
  walletConnected: boolean;
  walletAddress: `0x${string}` | undefined;
  customConnectButton: React.ReactNode;
  isPending: boolean;
  isSubmitted: boolean;
  isConfirmed: boolean;
  txHash: `0x${string}` | undefined;
  onSwap: (params: PlaceSwapParams) => Promise<`0x${string}` | null>;
  onApproveToken: (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => Promise<`0x${string}` | null>;
  onResetTxStatus: () => void;
}

function TokenDropdown({
  selected,
  exclude,
  onSelect,
}: {
  selected: SwapTokenKey;
  exclude: SwapTokenKey;
  onSelect: (key: SwapTokenKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cfg = SWAP_TOKENS[selected];
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl transition-all text-on-surface border border-outline/70"
        style={{
          background: open ? "var(--surface-container-high)" : "var(--surface-container)",
        }}
      >
        {TOKEN_ICONS[selected] ? (
          <img src={TOKEN_ICONS[selected]} alt={selected} className="w-5 h-5 rounded-full shrink-0 object-contain" />
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: "var(--primary)" }}>
            {selected.charAt(0)}
          </div>
        )}
        <span className="text-[13px] font-semibold tracking-tight">{cfg.symbol}</span>
        <ChevronDown
          size={12}
          className="transition-transform shrink-0 text-on-surface-muted"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden min-w-[230px] 
          bg-surface-low border border-outline shadow-sm"
        >
          {ALL_SWAP_TOKENS.filter((k) => k !== exclude).map((key) => {
            const c = SWAP_TOKENS[key];
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => { onSelect(key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                style={{ background: isSelected ? "var(--surface-container)" : "transparent" }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(66,70,84,0.2)"; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {TOKEN_ICONS[key] ? (
                  <img src={TOKEN_ICONS[key]} alt={key} className="w-6 h-6 rounded-full object-contain shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: "var(--primary)" }}>
                    {key.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[12px] font-semibold" style={{ color: isSelected ? "var(--primary)" : "var(--on-surface)" }}>{c.symbol}</span>
                  <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>{c.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SwapPanel({
  walletConnected,
  walletAddress,
  customConnectButton,
  isPending,
  isSubmitted,
  isConfirmed,
  txHash,
  onSwap,
  onApproveToken,
  onResetTxStatus,
}: SwapPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [fromKey, setFromKey] = useState<SwapTokenKey>("WETH");
  const [toKey, setToKey] = useState<SwapTokenKey>("USDC");
  const [amountInStr, setAmountInStr] = useState("");
  const [slippageBps, setSlippageBps] = useState(30);

  const fromCfg = SWAP_TOKENS[fromKey];
  const toCfg = SWAP_TOKENS[toKey];

  const isFromNative = fromKey === "WETH";
  const isToNative = toKey === "WETH";

  const handleFlip = useCallback(() => {
    setFromKey(toKey);
    setToKey(fromKey);
    setAmountInStr("");
  }, [fromKey, toKey]);

  const handleFromKeyChange = useCallback((key: SwapTokenKey) => {
    if (key === toKey) setToKey(fromKey);
    setFromKey(key);
    setAmountInStr("");
  }, [fromKey, toKey]);

  const handleToKeyChange = useCallback((key: SwapTokenKey) => {
    if (key === fromKey) setFromKey(toKey);
    setToKey(key);
  }, [fromKey, toKey]);

  // ── Vault oracle prices (mirrors Vault.swap: priceIn=minPrice, priceOut=maxPrice) ──
  const { data: priceInRaw } = useReadContract({
    ...contracts.vault,
    functionName: "getMinPrice",
    args: [fromCfg.address],
    query: { refetchInterval: 5_000, enabled: !STABLE_TOKENS.has(fromKey) },
  });

  const { data: priceOutRaw } = useReadContract({
    ...contracts.vault,
    functionName: "getMaxPrice",
    args: [toCfg.address],
    query: { refetchInterval: 5_000, enabled: !STABLE_TOKENS.has(toKey) },
  });

  // USD value of 1 token (1e30 precision from vault → float)
  const priceIn = useMemo(() => {
    if (STABLE_TOKENS.has(fromKey)) return 1.0;
    if (!priceInRaw) return null;
    return parseFloat(formatUnits(priceInRaw as bigint, PRICE_PRECISION_EXP));
  }, [fromKey, priceInRaw]);

  const priceOut = useMemo(() => {
    if (STABLE_TOKENS.has(toKey)) return 1.0;
    if (!priceOutRaw) return null;
    return parseFloat(formatUnits(priceOutRaw as bigint, PRICE_PRECISION_EXP));
  }, [toKey, priceOutRaw]);

  // ── Balances ──
  const { data: nativeBalance } = useBalance({
    address: walletAddress,
    query: { enabled: !!walletAddress && isFromNative, refetchInterval: 5_000 },
  });

  const { data: fromErc20Balance } = useReadContract({
    address: fromCfg.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress && !isFromNative, refetchInterval: 5_000 },
  });

  const fromBalanceRaw = isFromNative ? nativeBalance?.value : (fromErc20Balance as bigint | undefined);
  const fromBalanceNum = fromBalanceRaw !== undefined
    ? parseFloat(formatUnits(fromBalanceRaw, fromCfg.decimals))
    : 0;
  const fromBalanceUsd = priceIn !== null ? fromBalanceNum * priceIn : null;

  // ── Derived amounts ──
  const amountInNum = parseFloat(amountInStr) || 0;
  const feeBps = getFeeBps(fromKey, toKey);

  const estimatedOut = useMemo(() => {
    if (!priceIn || !priceOut || amountInNum <= 0) return 0;
    const rawOut = amountInNum * priceIn / priceOut;
    return rawOut * (1 - feeBps / 10_000);
  }, [amountInNum, priceIn, priceOut, feeBps]);

  const rate = useMemo(() => {
    if (!priceIn || !priceOut) return null;
    return priceIn / priceOut;
  }, [priceIn, priceOut]);

  const minOutNum = estimatedOut * (1 - slippageBps / 10_000);

  const insufficientBalance = walletConnected && amountInNum > 0 && amountInNum > fromBalanceNum;
  const pricesLoading = (priceIn === null || priceOut === null);
  const canSwap = !insufficientBalance && amountInNum > 0 && estimatedOut > 0 && !pricesLoading;

  const pctButtons = [25, 50, 75, 100];
  const handlePct = useCallback((pct: number) => {
    if (!walletConnected || fromBalanceNum <= 0) return;
    const amount = fromBalanceNum * (pct / 100);
    setAmountInStr(parseFloat(amount.toFixed(fromCfg.decimals > 6 ? 6 : fromCfg.decimals)).toString());
  }, [walletConnected, fromBalanceNum, fromCfg.decimals]);

  const handleSwap = useCallback(async () => {
    if (!walletAddress || !canSwap) return;

    const amountInRaw = parseUnits(
      parseFloat(amountInStr).toFixed(fromCfg.decimals),
      fromCfg.decimals
    );

    const minOutFixed = minOutNum.toFixed(toCfg.decimals > 8 ? 8 : toCfg.decimals);
    const minOutRaw = parseUnits(minOutFixed, toCfg.decimals);

    // ERC20 approval for Router (not needed for native ETH input)
    if (!isFromNative) {
      const approvalHash = await onApproveToken(fromCfg.address, contracts.router.address, maxUint256);
      if (!approvalHash) {
        toast.error("Approval Failed", {
          description: "Could not approve the token for swapping. Check your wallet and try again.",
        });
        return;
      }
    }

    console.log("[SwapPanel] Executing swap", {
      fromKey,
      toKey,
      amountIn: amountInRaw.toString(),
      minOut: minOutRaw.toString(),
      isFromNative,
      isToNative,
    });

    await onSwap({
      fromToken: fromCfg.address,
      toToken: toCfg.address,
      amountIn: amountInRaw,
      minOut: minOutRaw,
      receiver: walletAddress,
      isFromNative,
      isToNative,
    });
  }, [
    walletAddress, canSwap, amountInStr, fromCfg, toCfg,
    minOutNum, isFromNative, isToNative,
    fromKey, toKey, onSwap, onApproveToken,
  ]);

  const fromUsdValue = priceIn !== null && amountInNum > 0
    ? (amountInNum * priceIn).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : null;

  const toUsdValue = priceOut !== null && estimatedOut > 0
    ? (estimatedOut * priceOut).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : null;

  return (
    <div className="space-y-2">

      {/* ── FROM box ─────────────────────────────── */}
      <div className="rounded-xl p-3.5 bg-surface-low border border-outline/70">
        {/* Label row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-black dark:text-white font-medium uppercase tracking-wider">
            SELL
          </span>
          <span className="text-[10px] text-on-surface-muted font-mono">
            You pay
          </span>
        </div>

        {/* Token + Amount row */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex">
            <TokenDropdown selected={fromKey} exclude={toKey} onSelect={handleFromKeyChange} />
            <div className="flex-1 text-right">
              <Input
                type="number"
                value={amountInStr}
                onChange={(e) => setAmountInStr(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-right outline-none font-mono"
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: insufficientBalance ? "var(--sell)" : "var(--on-surface)",
                  letterSpacing: "-0.02em",
                }}
              />
            </div>
          </div>
          <div className="w-full flex justify-end">
            {fromUsdValue && (
              <span className="text-[11px] font-mono text-on-surface-muted">
                ${fromUsdValue}
              </span>
            )}
          </div>
        </div>

        {/* Percentage buttons */}
        {mounted && walletConnected && (
          <div className="flex items-center gap-1.5 mt-2.5">
            {pctButtons.map((pct) => (
              <button
                key={pct}
                onClick={() => handlePct(pct)}
                className="flex-1 py-1 rounded-lg text-[10px] text-on-surface-muted font-mono transition-all
                 bg-surface-container hover:bg-surface-container-high hover:text-on-surface"
              >
                {pct}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Flip button ──────────────────────────── */}
      <div className="flex justify-center -my-1 relative z-10">
        <button
          onClick={handleFlip}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all bg-surface-container border border-outline-variant hover:bg-surface-container-high"
          title="Flip tokens"
        >
          <ArrowUpDown size={13} style={{ color: "var(--on-surface-variant)" }} />
        </button>
      </div>

      {/* ── TO box ───────────────────────────────── */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: "var(--surface-container-low)",
          border: estimatedOut > 0 ? "1px solid rgba(0,192,118,0.18)" : "1px solid rgba(66,70,84,0.4)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-black dark:text-white font-medium uppercase tracking-wider">
            BUY
          </span>
          <span className="text-[10px] text-on-surface-muted font-mono">
            You receive
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TokenDropdown selected={toKey} exclude={fromKey} onSelect={handleToKeyChange} />
          <div className="flex-1 text-right">
            <span
              className="font-mono block"
              style={{
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: pricesLoading
                  ? "var(--on-surface-disabled)"
                  : estimatedOut > 0
                  ? "var(--buy)"
                  : "var(--on-surface-disabled)",
              }}
            >
              {pricesLoading ? "—" : estimatedOut > 0
                ? estimatedOut.toLocaleString("en-US", { maximumFractionDigits: 6 })
                : "0"}
            </span>
            {toUsdValue && (
              <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
                ≈ ${toUsdValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Info card ────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(66,70,84,0.3)" }}
      >
        {/* Rate row — only shown when quote is available */}
        {rate !== null && (
          <div
            className="flex items-center justify-between px-3 py-2 text-[11px]"
            style={{ borderBottom: "1px solid rgba(66,70,84,0.3)" }}
          >
            <span style={{ color: "var(--on-surface-disabled)" }}>Rate</span>
            <span className="font-mono" style={{ color: "var(--on-surface-variant)" }}>
              1 {fromCfg.symbol} ≈ {rate.toLocaleString("en-US", { maximumFractionDigits: 4 })} {toCfg.symbol}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 text-[11px]">
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderRight: "1px solid rgba(66,70,84,0.3)" }}
          >
            <span style={{ color: "var(--on-surface-disabled)" }}>Fee</span>
            <span className="font-mono" style={{ color: "var(--on-surface-variant)" }}>{feeBps / 100}%</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span style={{ color: "var(--on-surface-disabled)" }}>Min. rcvd</span>
            <span className="font-mono" style={{ color: "var(--on-surface-variant)" }}>
              {minOutNum > 0
                ? `${minOutNum.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${toCfg.symbol}`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Slippage ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Slippage tolerance</span>
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: "var(--surface-container-low)", border: "1px solid rgba(66,70,84,0.35)" }}
        >
          {SLIPPAGE_OPTIONS.map((bps) => (
            <button
              key={bps}
              onClick={() => setSlippageBps(bps)}
              className="px-2.5 py-1 text-[10px] font-mono rounded-md transition-all"
              style={{
                background: slippageBps === bps ? "var(--surface-container-high)" : "transparent",
                color: slippageBps === bps ? "var(--on-surface)" : "var(--on-surface-disabled)",
                fontWeight: slippageBps === bps ? 600 : 400,
              }}
            >
              {bps / 100}%
            </button>
          ))}
        </div>
      </div>

      {/* ── Validation hint ──────────────────────── */}
      {insufficientBalance && (
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px]"
          style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.2)", color: "var(--sell)" }}
        >
          Insufficient {fromCfg.symbol} balance
        </div>
      )}

      {/* ── Submit ───────────────────────────────── */}
      <div className="space-y-2 pt-0.5">
        {!mounted || !walletConnected ? (
          customConnectButton
        ) : (
          <button
            onClick={handleSwap}
            disabled={isPending || !canSwap}
            className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
            style={
              isPending || !canSwap
                ? {
                    background: "var(--surface-container)",
                    color: "var(--on-surface-disabled)",
                    cursor: "not-allowed",
                  }
                : {
                    background: "linear-gradient(135deg, #0E76FD 0%, #548dff 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    boxShadow: "0 0 20px 2px rgba(14,118,253,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
                  }
            }
          >
            {isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Signing…</>
            ) : pricesLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading prices…
              </>
            ) : amountInNum <= 0 ? (
              "Enter an amount"
            ) : insufficientBalance ? (
              `Insufficient ${fromCfg.symbol}`
            ) : (
              <span className="flex items-center gap-2">
                Swap
                <span className="flex hidden items-center gap-1.5 opacity-80">
                  <img src={TOKEN_ICONS[fromKey]} className="w-4 h-4 rounded-full object-contain" />
                  {fromCfg.symbol}
                </span>
                <span className="hidden" style={{ opacity: 0.5 }}>→</span>
                <span className="flex hidden items-center gap-1.5 opacity-80">
                  <img src={TOKEN_ICONS[toKey]} className="w-4 h-4 rounded-full object-contain" />
                  {toCfg.symbol}
                </span>
              </span>
            )}
          </button>
        )}

        {/* Tx status banner */}
        {(isSubmitted || isConfirmed) && txHash && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono"
            style={{
              background: isConfirmed ? "rgba(0,192,118,0.07)" : "rgba(14,118,253,0.07)",
              border: `1px solid ${isConfirmed ? "rgba(0,192,118,0.22)" : "rgba(14,118,253,0.22)"}`,
            }}
          >
            {isConfirmed ? (
              <span style={{ color: "var(--buy)" }}>✓</span>
            ) : (
              <Loader2 size={10} className="animate-spin shrink-0" style={{ color: "#0E76FD" }} />
            )}
            <span style={{ color: isConfirmed ? "var(--buy)" : "#0E76FD" }}>
              {isConfirmed ? "Swap confirmed" : "Confirming…"}
            </span>
            <span className="truncate" style={{ color: "var(--on-surface-disabled)" }}>
              {txHash.slice(0, 8)}…{txHash.slice(-6)}
            </span>
            <button onClick={onResetTxStatus} className="ml-auto opacity-40 hover:opacity-100 transition-opacity shrink-0">
              <X size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

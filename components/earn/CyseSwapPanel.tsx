"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { ArrowDownUp, Wallet, ChevronDown, Loader2 } from "lucide-react";
import { contracts, erc20Abi, PRICE_PRECISION } from "@/lib/protocol/contracts";
import { useStakingData } from "@/hooks/useStakingData";
import { useTradingActions } from "@/hooks/useTradingActions";

const SWAP_TOKENS = {
  WETH: { address: contracts.weth.address, decimals: 18, symbol: "ETH", name: "Ethereum" },
  BTC:  { address: contracts.btc.address, decimals: 8, symbol: "BTC", name: "Bitcoin" },
  USDC: { address: contracts.usdc.address, decimals: 6, symbol: "USDC", name: "USD Coin" },
  USDT: { address: contracts.usdt.address, decimals: 6, symbol: "USDT", name: "Tether" },
  USDG: { address: contracts.usdg.address, decimals: 18, symbol: "USDG", name: "USDG" },
  CYSE: { address: contracts.cyse.address, decimals: 18, symbol: "CYSE", name: "CYSE" },
} as const;

const STABLE_TOKENS = new Set(["USDC", "USDT", "USDG"]);
const PRICE_PRECISION_EXP = 30;

const TOKEN_COLORS: Record<string, string> = {
  WETH: "#627eea",
  BTC: "#f7931a",
  USDC: "#2775ca",
  USDT: "#26a17b",
  USDG: "#8b5cf6",
  CYSE: "var(--primary)",
};

function getFeeBps(fromToken: string, toToken: string): number {
  if (STABLE_TOKENS.has(fromToken) && STABLE_TOKENS.has(toToken)) return 4;
  return 30;
}

type SwapTokenKey = keyof typeof SWAP_TOKENS;
const ALL_SWAP_TOKENS = Object.keys(SWAP_TOKENS) as SwapTokenKey[];

interface CyseSwapPanelProps {
  customConnectButton: React.ReactNode;
}

export default function CyseSwapPanel({ customConnectButton }: CyseSwapPanelProps) {
  const { address } = useAccount();
  const staking = useStakingData();
  const tradingActions = useTradingActions();
  
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(30);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // For buy: pay with stable/ETH, receive CYSE
  // For sell: pay with CYSE, receive stable/ETH
  const [payToken, setPayToken] = useState<SwapTokenKey>("USDC");
  const [receiveToken, setReceiveToken] = useState<SwapTokenKey>("CYSE");

  useEffect(() => {
    if (mode === "buy") {
      setPayToken("USDC");
      setReceiveToken("CYSE");
    } else {
      setPayToken("CYSE");
      setReceiveToken("USDC");
    }
    setPayAmount("");
    setReceiveAmount("");
  }, [mode]);

  const payCfg = SWAP_TOKENS[payToken];
  const receiveCfg = SWAP_TOKENS[receiveToken];

  // Get prices from Vault for swap calculation
  const { data: priceInRaw } = useReadContract({
    ...contracts.vault,
    functionName: "getMinPrice",
    args: [payCfg.address],
    query: { refetchInterval: 5_000, enabled: !!address && !STABLE_TOKENS.has(payToken) },
  });

  const { data: priceOutRaw } = useReadContract({
    ...contracts.vault,
    functionName: "getMaxPrice",
    args: [receiveCfg.address],
    query: { refetchInterval: 5_000, enabled: !!address && !STABLE_TOKENS.has(receiveToken) },
  });

  // Get swap fee from Vault
  const { data: swapFeeBps } = useReadContract({
    address: contracts.vault.address,
    abi: contracts.vault.abi,
    functionName: "swapFeeBasisPoints",
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  // Calculate prices (1e30 precision from vault)
  const priceIn = useMemo(() => {
    if (STABLE_TOKENS.has(payToken)) return 1.0;
    if (!priceInRaw) return null;
    return parseFloat(formatUnits(priceInRaw as bigint, PRICE_PRECISION_EXP));
  }, [payToken, priceInRaw]);

  const priceOut = useMemo(() => {
    if (STABLE_TOKENS.has(receiveToken)) return 1.0;
    if (!priceOutRaw) return null;
    return parseFloat(formatUnits(priceOutRaw as bigint, PRICE_PRECISION_EXP));
  }, [receiveToken, priceOutRaw]);

  const feeBps = swapFeeBps ? Number(swapFeeBps) : getFeeBps(payToken, receiveToken);
  const swapFeePercent = feeBps / 100;

  // Calculate receive amount based on Vault prices
  useEffect(() => {
    const num = parseFloat(payAmount) || 0;
    if (num <= 0 || !priceIn || !priceOut) {
      setReceiveAmount("");
      return;
    }
    const rawOut = num * priceIn / priceOut;
    const afterFee = rawOut * (1 - feeBps / 10_000);
    setReceiveAmount(afterFee.toFixed(4));
  }, [payAmount, priceIn, priceOut, feeBps]);

  // Get balances
  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address && payToken === "WETH", refetchInterval: 5_000 },
  });

  const { data: payErc20Balance } = useReadContract({
    address: payCfg.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && payToken !== "WETH", refetchInterval: 5_000 },
  });

  const payBalanceRaw = payToken === "WETH" ? nativeBalance?.value : (payErc20Balance as bigint | undefined);
  const payBalanceNum = payBalanceRaw !== undefined
    ? parseFloat(formatUnits(payBalanceRaw, payCfg.decimals))
    : 0;


  const handlePayChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    setPayAmount(clean);
  };

  const handlePct = useCallback((pct: number) => {
    if (!address || payBalanceNum <= 0) return;
    const amount = payBalanceNum * (pct / 100);
    setPayAmount(parseFloat(amount.toFixed(payCfg.decimals > 6 ? 6 : payCfg.decimals)).toString());
  }, [address, payBalanceNum, payCfg.decimals]);

  const handleSwap = useCallback(async () => {
    if (!address || !payAmount || parseFloat(payAmount) <= 0) return;

    setIsSwapping(true);
    setTxStatus("Initiating swap...");

    try {
      const amountInRaw = parseUnits(
        parseFloat(payAmount).toFixed(payCfg.decimals),
        payCfg.decimals
      );

      const receiveNum = parseFloat(receiveAmount) || 0;
      const minOutRaw = parseUnits(
        (receiveNum * (1 - slippageBps / 10_000)).toFixed(receiveCfg.decimals),
        receiveCfg.decimals
      );

      const isFromNative = payToken === "WETH";
      const isToNative = receiveToken === "WETH";

      // Approve token if not native
      if (!isFromNative) {
        const approvalHash = await tradingActions.approveToken(
          payCfg.address,
          contracts.router.address,
          amountInRaw
        );
        if (!approvalHash) {
          setTxStatus("Approval failed");
          return;
        }
      }

      const hash = await tradingActions.placeSwap({
        fromToken: payCfg.address,
        toToken: receiveCfg.address,
        amountIn: amountInRaw,
        minOut: minOutRaw,
        receiver: address,
        isFromNative,
        isToNative,
      });

      if (hash) {
        setTxStatus("Swap submitted successfully!");
        setPayAmount("");
        setReceiveAmount("");
      } else {
        setTxStatus("Swap failed");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Swap failed";
      setTxStatus(`Error: ${message}`);
    } finally {
      setIsSwapping(false);
    }
  }, [address, payAmount, receiveAmount, payCfg, receiveCfg, payToken, receiveToken, slippageBps, tradingActions]);

  const canSwap = address && parseFloat(payAmount) > 0 && parseFloat(payAmount) <= payBalanceNum && priceIn !== null && priceOut !== null;

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Buy / Sell Tabs */}
      <div className="flex items-center" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <button
          onClick={() => setMode("buy")}
          className={`flex-1 py-3 text-center text-[13px] font-mono font-semibold transition-colors ${
            mode === "buy"
              ? "text-white border-b-2" 
              : "text-[var(--on-surface-disabled)] hover:text-[var(--on-surface-muted)]"
          }`}
          style={{ 
            borderColor: mode === "buy" ? "var(--buy)" : "transparent",
            background: mode === "buy" ? "rgba(0,192,118,0.05)" : "transparent"
          }}
        >
          Buy CYSE
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`flex-1 py-3 text-center text-[13px] font-mono font-semibold transition-colors ${
            mode === "sell"
              ? "text-white border-b-2"
              : "text-[var(--on-surface-disabled)] hover:text-[var(--on-surface-muted)]"
          }`}
          style={{ 
            borderColor: mode === "sell" ? "var(--sell)" : "transparent",
            background: mode === "sell" ? "rgba(255,77,79,0.05)" : "transparent"
          }}
        >
          Sell CYSE
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Pay Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Pay</span>
            {address && (
              <button
                onClick={() => handlePct(100)}
                className="text-[10px] font-mono transition-colors"
                style={{ color: "var(--on-surface-disabled)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)"; }}
              >
                Balance: {payBalanceNum.toLocaleString("en-US", { maximumFractionDigits: 5 })} {payCfg.symbol}
              </button>
            )}
          </div>
          <div className="flex items-center rounded-lg px-3 py-3" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)" }}>
            <input
              type="text"
              value={payAmount}
              onChange={(e) => handlePayChange(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-white text-[18px] font-mono font-semibold outline-none"
              style={{ color: "var(--on-surface)" }}
            />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--surface-container-high)", border: "1px solid rgba(66,70,84,0.4)" }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: TOKEN_COLORS[payToken] || "var(--primary)" }}
              >
                {payCfg.symbol.charAt(0)}
              </div>
              <span className="text-white text-[13px] font-mono font-medium" style={{ color: "var(--on-surface)" }}>{payCfg.symbol}</span>
              <ChevronDown size={13} style={{ color: "var(--on-surface-disabled)" }} />
            </button>
          </div>
          {address && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePct(pct)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors"
                  style={{ color: "var(--on-surface-disabled)", background: "var(--surface-container)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)";
                    (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                    (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)";
                  }}
                >
                  {pct === 100 ? "Max" : `${pct}%`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Direction */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setMode(mode === "buy" ? "sell" : "buy")}
            title="Switch direction"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)", color: "var(--on-surface-disabled)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)"; }}
          >
            <ArrowDownUp size={14} />
          </button>
        </div>

        {/* Receive Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Receive</span>
            <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              {priceIn && priceOut ? `Rate: ${priceIn.toFixed(4)} ${payCfg.symbol} = ${priceOut.toFixed(4)} ${receiveCfg.symbol}` : "Loading price..."}
            </span>
          </div>
          <div className="flex items-center rounded-lg px-3 py-3" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.4)" }}>
            <input
              type="text"
              value={receiveAmount}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-white text-[18px] font-mono font-semibold outline-none"
              style={{ color: "var(--on-surface)" }}
            />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-container-high)", border: "1px solid rgba(66,70,84,0.4)" }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: receiveToken === "CYSE" ? "var(--primary)" : receiveToken === "WETH" ? "#627eea" : receiveToken === "USDC" ? "#2775ca" : "#26a17b" }}
              >
                {receiveCfg.symbol.charAt(0)}
              </div>
              <span className="text-white text-[13px] font-mono font-medium" style={{ color: "var(--on-surface)" }}>{receiveCfg.symbol}</span>
              <ChevronDown size={13} style={{ color: "var(--on-surface-disabled)" }} />
            </button>
          </div>
        </div>

        {/* Slippage */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Slippage Tolerance</span>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.35)" }}>
            {[10, 30, 50, 100].map((bps) => (
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

        {/* Summary */}
        {payAmount && parseFloat(payAmount) > 0 && priceIn && priceOut && (
          <div className="space-y-1.5 pt-1" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span style={{ color: "var(--on-surface-disabled)" }}>Swap Fee</span>
              <span style={{ color: "var(--on-surface)" }}>{swapFeePercent.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span style={{ color: "var(--on-surface-disabled)" }}>Min Output</span>
              <span style={{ color: "var(--on-surface)" }}>
                {receiveAmount ? `${(parseFloat(receiveAmount) * (1 - slippageBps / 10000)).toFixed(4)} ${receiveCfg.symbol}` : "-"}
              </span>
            </div>
          </div>
        )}

        {/* Tx Status */}
        {txStatus && (
          <div className="text-[11px] font-mono px-3 py-2 rounded" style={{
            background: txStatus.startsWith("Error") ? "rgba(255,77,79,0.1)" : "rgba(14,118,253,0.1)",
            color: txStatus.startsWith("Error") ? "var(--sell)" : "var(--primary)",
            border: txStatus.startsWith("Error") ? "1px solid rgba(255,77,79,0.2)" : "1px solid rgba(14,118,253,0.2)",
          }}>
            {txStatus}
          </div>
        )}

        {/* Action Button */}
        {!address ? (
          customConnectButton
        ) : (
          <button
            onClick={handleSwap}
            disabled={isSwapping || !canSwap}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-mono font-semibold transition-colors disabled:opacity-40"
            style={{
              background: "var(--primary)",
              color: "#fff",
            }}
          >
            {isSwapping ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : !payAmount || parseFloat(payAmount) <= 0 ? (
              "Enter an amount"
            ) : parseFloat(payAmount) > payBalanceNum ? (
              `Insufficient ${payCfg.symbol}`
            ) : (
              `${mode === "buy" ? "Buy" : "Sell"} CYSE`
            )}
          </button>
        )}
      </div>
    </div>
  );
}

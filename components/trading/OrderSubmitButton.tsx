"use client";

import { Loader2, X } from "lucide-react";

interface OrderSubmitButtonProps {
  walletConnected: boolean;
  customConnectButton: React.ReactNode;
  orderSigning: boolean;
  hasErrors: boolean;
  isOracleValid: boolean;
  qtyNum: number;
  side: "buy" | "sell";
  symbol: string;
  isMarket: boolean;
  priceNum: number;
  reduceOnlyError: string | null;
  validationErrorMessages: string[];
  isSubmitted: boolean;
  isConfirmed: boolean;
  txHash: string | undefined;
  onSubmit: () => void;
  onResetTxStatus: () => void;
}

export default function OrderSubmitButton({
  walletConnected,
  customConnectButton,
  orderSigning,
  hasErrors,
  isOracleValid,
  qtyNum,
  side,
  symbol,
  isMarket,
  priceNum,
  reduceOnlyError,
  validationErrorMessages,
  isSubmitted,
  isConfirmed,
  txHash,
  onSubmit,
  onResetTxStatus,
}: OrderSubmitButtonProps) {
  if (!walletConnected) {
    return (
      <div className="space-y-2 pt-1">
        {customConnectButton}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <button
        onClick={onSubmit}
        disabled={orderSigning || hasErrors || !isOracleValid || qtyNum <= 0}
        className="w-full py-2.5 text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
        style={{
          background: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0
            ? "var(--surface-container-low)"
            : side === "buy"
            ? "linear-gradient(135deg, var(--buy) 0%, var(--buy-bright) 100%)"
            : "linear-gradient(135deg, var(--sell) 0%, var(--sell-bright) 100%)",
          color: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0
            ? "var(--on-surface-disabled)"
            : side === "buy" ? "#000" : "var(--on-primary)",
          cursor: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0 ? "not-allowed" : "pointer",
          boxShadow: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0
            ? "none"
            : side === "buy"
            ? "0 0 16px 2px rgba(0,192,118,0.25)"
            : "0 0 16px 2px rgba(255,77,79,0.25)",
        }}
      >
        {orderSigning ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Signing…
          </>
        ) : !isOracleValid ? (
          "Oracle Unavailable"
        ) : reduceOnlyError ? (
          reduceOnlyError
        ) : qtyNum <= 0 && !isMarket && priceNum <= 0 ? (
          "Set a price & quantity"
        ) : !isMarket && priceNum <= 0 ? (
          "Mark a limit price"
        ) : qtyNum <= 0 ? (
          isMarket ? "How much to trade?" : "Enter a quantity"
        ) : hasErrors ? (
          validationErrorMessages[0] ?? "Fix order to continue"
        ) : (
          `${side === "buy" ? "Buy / Long" : "Sell / Short"} ${symbol}`
        )}
      </button>

      {/* Non-blocking on-chain status — visible while tx is submitted/confirmed */}
      {(isSubmitted || isConfirmed) && txHash && (
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono"
          style={{
            background: isConfirmed ? "rgba(0,192,118,0.08)" : "rgba(99,179,255,0.06)",
            border: `1px solid ${isConfirmed ? "rgba(0,192,118,0.2)" : "rgba(99,179,255,0.15)"}`,
          }}
        >
          {isConfirmed ? (
            <span style={{ color: "var(--buy)" }}>✓</span>
          ) : (
            <Loader2 size={10} className="animate-spin shrink-0" style={{ color: "#63b3ff" }} />
          )}
          <span style={{ color: isConfirmed ? "var(--buy)" : "#63b3ff" }}>
            {isConfirmed ? "Confirmed" : "Confirming…"}
          </span>
          <span className="truncate" style={{ color: "var(--on-surface-disabled)" }}>
            {txHash.slice(0, 8)}…{txHash.slice(-6)}
          </span>
          <button onClick={onResetTxStatus} className="ml-auto opacity-50 hover:opacity-100 shrink-0">
            <X size={9} />
          </button>
        </div>
      )}
    </div>
  );
}

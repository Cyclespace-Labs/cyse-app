"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import SlippageSelector from "./SlippageSelector";

interface OrderOptionsPanelProps {
  walletConnected: boolean;
  postOnly: boolean;
  onPostOnlyChange: (value: boolean) => void;
  ioc: boolean;
  onIocChange: (value: boolean) => void;
  reduceOnly: boolean;
  onReduceOnlyChange: (value: boolean) => void;
  slippageBps: number;
  onSlippageChange: (value: number) => void;
  orderSigning: boolean;
  hardErrorMessages: string[];
  hintMessages: string[];
  tpslErrorMessages: string[];
  validationWarnings: string[];
}

export default function OrderOptionsPanel({
  walletConnected,
  postOnly,
  onPostOnlyChange,
  ioc,
  onIocChange,
  reduceOnly,
  onReduceOnlyChange,
  slippageBps,
  onSlippageChange,
  orderSigning,
  hardErrorMessages,
  hintMessages,
  tpslErrorMessages,
  validationWarnings,
}: OrderOptionsPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !walletConnected) return null;

  return (
    <>
      {/* Order Options */}
      <div className="pt-1 space-y-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
        <SlippageSelector value={slippageBps} onChange={onSlippageChange} disabled={orderSigning} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={postOnly} onChange={(e) => onPostOnlyChange(e.target.checked)} />
            <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Post Only</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={ioc} onChange={(e) => onIocChange(e.target.checked)} />
            <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>IOC</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={reduceOnly} onChange={(e) => onReduceOnlyChange(e.target.checked)} />
            <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Reduce Only</span>
          </label>
        </div>
      </div>

      {/* Validation Messages */}
      {(hardErrorMessages.length > 0 || hintMessages.length > 0 || validationWarnings.length > 0 || tpslErrorMessages.length > 0) && (
        <div className="space-y-1 hidden">
          {hardErrorMessages.map((err, i) => (
            <div key={`err-${i}`} className="flex items-center gap-1.5 text-[10px] text-sell">
              <AlertTriangle size={10} />
              <span>{err}</span>
            </div>
          ))}
          {hintMessages.map((hint, i) => (
            <div key={`hint-${i}`} className="flex items-center gap-1.5 text-[10px] text-warning">
              <AlertTriangle size={10} />
              <span>{hint}</span>
            </div>
          ))}
          {tpslErrorMessages.map((err, i) => (
            <div key={`tpsl-err-${i}`} className="flex items-center gap-1.5 text-[10px] text-warning">
              <AlertTriangle size={10} />
              <span>{err}</span>
            </div>
          ))}
          {validationWarnings.map((warn, i) => (
            <div key={`warn-${i}`} className="flex items-center gap-1.5 text-[10px] text-warning">
              <AlertTriangle size={10} />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

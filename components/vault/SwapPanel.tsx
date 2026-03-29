"use client";

import { useState } from "react";
import { VaultDetail } from "@/types/vault";
import { ArrowDownUp, Wallet, Settings, ChevronDown } from "lucide-react";

interface SwapPanelProps {
  vault: VaultDetail;
}

export default function SwapPanel({ vault }: SwapPanelProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [slippage, setSlippage] = useState("0.3");
  const [showSettings, setShowSettings] = useState(false);

  const payToken = mode === "buy" ? vault.assets[1]?.symbol || "USDC" : vault.name;
  const receiveToken = mode === "buy" ? vault.name : vault.assets[1]?.symbol || "USDC";

  const handlePayChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    setPayAmount(clean);
    const num = parseFloat(clean) || 0;
    setReceiveAmount(num > 0 ? (num * 0.998).toFixed(4) : "");
  };

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden h-fit">
      {/* Buy / Sell Tabs */}
      <div className="flex items-center border-b border-[#1c1c28]">
        <button
          onClick={() => setMode("buy")}
          className={`flex-1 py-3 text-center text-[13px] font-mono font-semibold transition-colors ${
            mode === "buy"
              ? "text-white border-b-2 border-[#00c076] bg-[#00c076]/5"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Buy {vault.type}
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`flex-1 py-3 text-center text-[13px] font-mono font-semibold transition-colors ${
            mode === "sell"
              ? "text-white border-b-2 border-[#ff4d4f] bg-[#ff4d4f]/5"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Sell {vault.type}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Pay Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#5a5a6a] text-[11px] font-mono">Pay</span>
            <span className="text-[#5a5a6a] text-[10px] font-mono">Balance: 0.00</span>
          </div>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded-lg px-3 py-3">
            <input
              type="text"
              value={payAmount}
              onChange={(e) => handlePayChange(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-white text-[18px] font-mono font-semibold outline-none"
            />
            <button className="flex items-center gap-1.5 bg-[#1c1c28] px-3 py-1.5 rounded-lg hover:bg-[#2a2a3a] transition-colors">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: vault.assets[mode === "buy" ? 1 : 0]?.color || "#5a5a6a" }}
              >
                {vault.assets[mode === "buy" ? 1 : 0]?.logo || "?"}
              </div>
              <span className="text-white text-[13px] font-mono font-medium">{payToken}</span>
              <ChevronDown size={13} className="text-[#5a5a6a]" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                className="text-[10px] font-mono text-[#5a5a6a] hover:text-white px-1.5 py-0.5 rounded bg-[#1c1c28] hover:bg-[#2a2a3a] transition-colors"
              >
                {pct === 100 ? "Max" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Swap Direction */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setMode(mode === "buy" ? "sell" : "buy")}
            title="Switch direction"
            className="w-8 h-8 rounded-full bg-[#1c1c28] flex items-center justify-center text-[#5a5a6a] hover:text-white hover:bg-[#2a2a3a] transition-colors"
          >
            <ArrowDownUp size={14} />
          </button>
        </div>

        {/* Receive Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#5a5a6a] text-[11px] font-mono">Receive</span>
          </div>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded-lg px-3 py-3">
            <input
              type="text"
              value={receiveAmount}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-white text-[18px] font-mono font-semibold outline-none"
            />
            <button className="flex items-center gap-1.5 bg-[#1c1c28] px-3 py-1.5 rounded-lg">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: vault.assets[mode === "buy" ? 0 : 1]?.color || "#5a5a6a" }}
              >
                {vault.assets[mode === "buy" ? 0 : 1]?.logo || "?"}
              </div>
              <span className="text-white text-[13px] font-mono font-medium">{receiveToken}</span>
              <ChevronDown size={13} className="text-[#5a5a6a]" />
            </button>
          </div>
        </div>

        {/* Slippage */}
        <div className="flex items-center justify-between">
          <span className="text-[#5a5a6a] text-[11px] font-mono">Slippage Tolerance</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-[#8a8a9a] text-[11px] font-mono hover:text-white transition-colors"
          >
            {slippage}% <Settings size={11} />
          </button>
        </div>
        {showSettings && (
          <div className="flex items-center gap-1.5">
            {["0.1", "0.3", "0.5", "1.0"].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                  slippage === s
                    ? "bg-[#0E76FD] text-white"
                    : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        )}

        {/* Summary */}
        {payAmount && parseFloat(payAmount) > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-[#1c1c28]">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#5a5a6a]">Price Impact</span>
              <span className="text-[#00c076]">&lt;0.01%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#5a5a6a]">Fee</span>
              <span className="text-white">$0.00</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#0E76FD] text-white text-[14px] font-mono font-semibold rounded-lg hover:bg-[#2d8afd] transition-colors">
          <Wallet size={16} />
          Connect Wallet
        </button>
      </div>
    </div>
  );
}

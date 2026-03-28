"use client";

import { useState } from "react";
import { PredictionMarketDetail } from "@/types/predictions";

interface PredictionTradingPanelProps {
  market: PredictionMarketDetail;
}

const quickAmounts = ["+$1", "+$5", "+$10", "+$100", "Max"];

export default function PredictionTradingPanel({ market }: PredictionTradingPanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("0");
  const [selectedOption, setSelectedOption] = useState(0);

  const option = market.options[selectedOption];
  const isUpDown = option?.label === "Up" || option?.label === "Down";

  const yesPrice = option?.yesPrice ?? (option?.percentage ? option.percentage / 100 : 0.5);
  const noPrice = option?.noPrice ?? (1 - yesPrice);

  const amountNum = parseFloat(amount) || 0;
  const estimatedShares = yesPrice > 0 ? Math.floor(amountNum / yesPrice) : 0;

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden h-fit">
      {/* Selected Option Header */}
      {!isUpDown && market.options.length > 2 && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1c1c28]">
          <div
            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: market.iconColor }}
          >
            {market.tokenIcon}
          </div>
          <span className="text-white text-[13px] font-mono font-medium">
            {option?.label || market.options[0]?.label}
          </span>
        </div>
      )}

      {/* Buy / Sell Tabs */}
      <div className="flex items-center px-4 pt-3 pb-2 gap-4">
        <button
          onClick={() => setSide("buy")}
          className={`text-[13px] font-mono font-medium transition-colors pb-1 ${
            side === "buy"
              ? "text-white border-b-2 border-white"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`text-[13px] font-mono font-medium transition-colors pb-1 ${
            side === "sell"
              ? "text-white border-b-2 border-white"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Sell
        </button>
        <div className="ml-auto">
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
            title="Order type"
            className="bg-[#12121a] border border-[#1c1c28] text-white text-[11px] font-mono rounded px-2 py-1 outline-none"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </div>
      </div>

      {/* Outcome Buttons */}
      <div className="flex gap-2 px-4 pb-3">
        {isUpDown ? (
          <>
            <button
              onClick={() => setSelectedOption(0)}
              className={`flex-1 py-2.5 rounded text-[13px] font-mono font-medium transition-colors ${
                selectedOption === 0
                  ? "bg-[#00c076] text-black"
                  : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
              }`}
            >
              Up {(yesPrice * 100).toFixed(0)}¢
            </button>
            <button
              onClick={() => setSelectedOption(1)}
              className={`flex-1 py-2.5 rounded text-[13px] font-mono font-medium transition-colors ${
                selectedOption === 1
                  ? "bg-[#ff4d4f] text-white"
                  : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
              }`}
            >
              Down {(noPrice * 100).toFixed(0)}¢
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2.5 rounded text-[13px] font-mono font-medium transition-colors ${
                side === "buy"
                  ? "bg-[#00c076] text-black"
                  : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
              }`}
            >
              Yes {option?.yesPrice !== undefined ? `${option.yesPrice}¢` : "0.2¢"}
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2.5 rounded text-[13px] font-mono font-medium transition-colors ${
                side === "sell"
                  ? "bg-[#ff4d4f] text-white"
                  : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
              }`}
            >
              No {option?.noPrice !== undefined ? `${option.noPrice}¢` : "99.9¢"}
            </button>
          </>
        )}
      </div>

      {/* Amount */}
      <div className="px-4 pb-3">
        <label className="text-[#5a5a6a] text-[11px] font-mono block mb-1.5">Amount</label>
        <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-3">
          <span className="text-[#5a5a6a] text-lg font-mono mr-2">$</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="flex-1 bg-transparent text-white text-xl font-mono font-semibold outline-none"
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex items-center gap-1.5 px-4 pb-4">
        {quickAmounts.map((qa) => (
          <button
            key={qa}
            onClick={() => {
              if (qa === "Max") {
                setAmount("1000");
              } else {
                const add = parseFloat(qa.replace("+$", ""));
                setAmount(String((parseFloat(amount) || 0) + add));
              }
            }}
            className="px-2.5 py-1 text-[11px] font-mono bg-[#1c1c28] text-[#8a8a9a] rounded hover:bg-[#2a2a3a] hover:text-white transition-colors"
          >
            {qa}
          </button>
        ))}
      </div>

      {/* Info */}
      {amountNum > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#5a5a6a]">Est. shares</span>
            <span className="text-white">{estimatedShares.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#5a5a6a]">Avg. price</span>
            <span className="text-white">{(yesPrice * 100).toFixed(1)}¢</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#5a5a6a]">Potential return</span>
            <span className="text-[#00c076]">
              ${(estimatedShares * 1 - amountNum).toFixed(2)} ({((1 / yesPrice - 1) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {/* Trade Button */}
      <div className="px-4 pb-4">
        <button className="w-full py-3 rounded text-[14px] font-mono font-semibold bg-[#00c076] text-black hover:bg-[#00d884] transition-colors">
          Trade
        </button>
      </div>

      {/* Terms */}
      <div className="px-4 pb-3 text-center">
        <span className="text-[#5a5a6a] text-[10px] font-mono">
          By trading, you agree to the{" "}
          <span className="text-[#00c076] cursor-pointer hover:underline">Terms of Use</span>.
        </span>
      </div>
    </div>
  );
}

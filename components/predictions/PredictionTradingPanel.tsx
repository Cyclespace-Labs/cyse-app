"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { PredictionMarketDetail } from "@/types/predictions";

interface PredictionTradingPanelProps {
  market: PredictionMarketDetail;
}

const quickAmounts = ["+$1", "+$5", "+$10", "+$100", "Max"];
const sharePcts = [25, 50, 75, 100];
const expirations = ["Good til cancelled", "1 day", "1 week", "1 month"];

export default function PredictionTradingPanel({ market }: PredictionTradingPanelProps) {
  const searchParams = useSearchParams();

  const getInitialSide = (): "buy" | "sell" => {
    const sideParam = searchParams.get("side");
    return sideParam === "sell" ? "sell" : "buy";
  };

  const getInitialOption = (): number => {
    const optionParam = searchParams.get("option");
    if (optionParam !== null) {
      const optionIndex = parseInt(optionParam, 10);
      if (!isNaN(optionIndex) && optionIndex >= 0 && optionIndex < market.options.length) {
        return optionIndex;
      }
    }
    return 0;
  };

  const getInitialOrderType = (): "market" | "limit" => {
    const typeParam = searchParams.get("orderType");
    return typeParam === "limit" ? "limit" : "market";
  };

  const getInitialLimitPrice = (): string => {
    const priceParam = searchParams.get("price");
    return priceParam ?? "";
  };

  const [side, setSide] = useState<"buy" | "sell">(getInitialSide);
  const [orderType, setOrderType] = useState<"market" | "limit">(getInitialOrderType);
  const [amount, setAmount] = useState("0");
  const [selectedOption, setSelectedOption] = useState(getInitialOption);
  const [limitPrice, setLimitPrice] = useState(getInitialLimitPrice);
  const [shares, setShares] = useState("");
  const [expiration, setExpiration] = useState(expirations[0]);
  const [showExpiration, setShowExpiration] = useState(false);

  const option = market.options[selectedOption];
  const isUpDown = option?.label === "Up" || option?.label === "Down";

  const yesPrice = option?.yesPrice ?? (option?.percentage ? option.percentage / 100 : 0.5);
  const noPrice = option?.noPrice ?? (1 - yesPrice);
  const activePrice = side === "buy" ? yesPrice : noPrice;

  // Market order calculations
  const amountNum = parseFloat(amount) || 0;
  const estimatedShares = activePrice > 0 ? Math.floor(amountNum / activePrice) : 0;

  // Limit order calculations
  const limitPriceNum = parseFloat(limitPrice) || 0;
  const sharesNum = parseFloat(shares) || 0;
  const limitTotal = (sharesNum * limitPriceNum) / 100;
  const limitToWin = sharesNum - limitTotal;

  const handleLimitPriceStep = (delta: number) => {
    const current = limitPriceNum || (activePrice * 100);
    const next = Math.max(0.1, Math.round((current + delta) * 10) / 10);
    setLimitPrice(next.toFixed(1));
  };

  const handleSharePct = (pct: number) => {
    const maxBudget = 1000;
    const price = limitPriceNum > 0 ? limitPriceNum / 100 : activePrice;
    if (price <= 0) return;
    const maxShares = Math.floor((maxBudget * (pct / 100)) / price);
    setShares(String(maxShares));
  };

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

      {/* Buy / Sell Tabs + Order Type */}
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
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setOrderType("market")}
            className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
              orderType === "market"
                ? "bg-[#1c1c28] text-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            Market
          </button>
          <button
            onClick={() => {
              setOrderType("limit");
              if (!limitPrice) {
                setLimitPrice((activePrice * 100).toFixed(1));
              }
            }}
            className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
              orderType === "limit"
                ? "bg-[#1c1c28] text-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            Limit
          </button>
        </div>
      </div>

      {/* Outcome Buttons */}
      <div className="flex gap-2 px-4 pb-3">
        {isUpDown ? (
          <>
            <button
              onClick={() => { setSelectedOption(0); setSide("buy"); }}
              className={`flex-1 py-2.5 rounded text-[13px] font-mono font-medium transition-colors ${
                selectedOption === 0 && side === "buy"
                  ? "bg-[#00c076] text-black"
                  : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
              }`}
            >
              Yes {(yesPrice * 100).toFixed(0)}&cent;
            </button>
            <button
              onClick={() => { setSelectedOption(1); setSide("sell"); }}
              className={`flex-1 py-2.5 rounded text-[13px] font-mono font-medium transition-colors ${
                selectedOption === 1 || side === "sell"
                  ? "bg-[#ff4d4f] text-white"
                  : "bg-[#1c1c28] text-[#5a5a6a] hover:text-white"
              }`}
            >
              No {(noPrice * 100).toFixed(0)}&cent;
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

      {orderType === "market" ? (
        <>
          {/* Market Order: Amount */}
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

          {/* Market Order Info */}
          {amountNum > 0 && (
            <div className="px-4 pb-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#5a5a6a]">Est. shares</span>
                <span className="text-white">{estimatedShares.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#5a5a6a]">Avg. price</span>
                <span className="text-white">{(activePrice * 100).toFixed(1)}&cent;</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#5a5a6a]">Potential return</span>
                <span className="text-[#00c076]">
                  ${(estimatedShares * 1 - amountNum).toFixed(2)} ({activePrice > 0 ? ((1 / activePrice - 1) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Limit Order: Limit Price */}
          <div className="px-4 pb-3">
            <label className="text-[#5a5a6a] text-[11px] font-mono block mb-1.5">Limit Price</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLimitPriceStep(-1)}
                title="Decrease price"
                className="w-8 h-10 flex items-center justify-center bg-[#1c1c28] rounded text-[#8a8a9a] hover:text-white hover:bg-[#2a2a3a] transition-colors"
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2.5">
                <input
                  type="text"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-white text-[15px] font-mono font-semibold outline-none text-center"
                />
                <span className="text-[#5a5a6a] text-[13px] font-mono ml-1">&cent;</span>
              </div>
              <button
                onClick={() => handleLimitPriceStep(1)}
                title="Increase price"
                className="w-8 h-10 flex items-center justify-center bg-[#1c1c28] rounded text-[#8a8a9a] hover:text-white hover:bg-[#2a2a3a] transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Limit Order: Shares */}
          <div className="px-4 pb-3">
            <label className="text-[#5a5a6a] text-[11px] font-mono block mb-1.5">Shares</label>
            <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2.5">
              <input
                type="text"
                value={shares}
                onChange={(e) => setShares(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                className="flex-1 bg-transparent text-white text-[15px] font-mono font-semibold outline-none"
              />
            </div>
          </div>

          {/* Share Percentage Buttons */}
          <div className="flex items-center gap-1.5 px-4 pb-3">
            {sharePcts.map((pct) => (
              <button
                key={pct}
                onClick={() => handleSharePct(pct)}
                className="flex-1 py-1 text-[11px] font-mono bg-[#1c1c28] text-[#8a8a9a] rounded hover:bg-[#2a2a3a] hover:text-white transition-colors text-center"
              >
                {pct === 100 ? "Max" : `${pct}%`}
              </button>
            ))}
          </div>

          {/* Set Expiration */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[#5a5a6a] text-[11px] font-mono">Set Expiration</span>
              <button
                onClick={() => setShowExpiration(!showExpiration)}
                title="Toggle expiration"
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  showExpiration ? "bg-[#00c076]" : "bg-[#2a2a3a]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    showExpiration ? "left-4" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            {showExpiration && (
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                title="Expiration"
                className="mt-2 w-full bg-[#12121a] border border-[#1c1c28] text-white text-[11px] font-mono rounded px-2 py-1.5 outline-none"
              >
                {expirations.map((exp) => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            )}
          </div>

          {/* Limit Order Totals */}
          <div className="px-4 pb-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#5a5a6a]">Total</span>
              <span className={limitTotal > 0 ? "text-white" : "text-[#00c076]"}>
                ${limitTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#5a5a6a]">To win</span>
              <span className="text-[#00c076]">
                ${limitToWin > 0 ? limitToWin.toFixed(2) : "0"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Trade Button */}
      <div className="px-4 pb-4">
        <button
          className={`w-full py-3 rounded text-[14px] font-mono font-semibold transition-colors ${
            side === "buy"
              ? "bg-[#00c076] text-black hover:bg-[#00d884]"
              : "bg-[#ff4d4f] text-white hover:bg-[#ff6b6b]"
          }`}
        >
          {orderType === "limit" ? "Place Limit Order" : "Trade"}
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

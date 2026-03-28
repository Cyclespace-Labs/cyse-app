"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const orderTypes = ["Limit", "Market", "Conditional"];

export default function TradingPanel() {
  const [activeType, setActiveType] = useState("Limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("86.09");
  const [quantity, setQuantity] = useState("0");
  const [leverage, setLeverage] = useState(50);
  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] text-white">
      {/* Buy/Sell Toggle */}
      <div className="flex border-b border-[#1c1c28]">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
            side === "buy"
              ? "text-[#00c076] border-b-2 border-[#00c076]"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
            side === "sell"
              ? "text-[#ff4d4f] border-b-2 border-[#ff4d4f]"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1c1c28]">
        {orderTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
              activeType === type
                ? "text-white bg-[#1c1c28]"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {type}
          </button>
        ))}
        <ChevronDown size={12} className="text-[#5a5a6a] ml-auto" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Available Equity */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#5a5a6a]">Available Equity</span>
          <span className="text-white">$0.00</span>
        </div>

        {/* Price Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#5a5a6a]">Price</span>
            <div className="flex items-center gap-1">
              {["Mid", "BBO"].map((label) => (
                <button
                  key={label}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${
                    label === "BBO"
                      ? "text-yellow-400 bg-yellow-400/10"
                      : "text-[#5a5a6a] hover:text-[#8a8a9a]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2">
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
            />
            <div className="flex items-center gap-1">
              <button className="w-5 h-5 flex items-center justify-center text-[#5a5a6a] hover:text-white bg-[#1c1c28] rounded text-xs">
                −
              </button>
              <button className="w-5 h-5 flex items-center justify-center text-[#5a5a6a] hover:text-white bg-[#1c1c28] rounded text-xs">
                +
              </button>
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <span className="text-[11px] text-[#5a5a6a] mb-1 block">Quantity</span>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
            />
            <span className="text-[#5a5a6a] text-[11px] ml-2">SOL</span>
          </div>
        </div>

        {/* Leverage Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="w-full relative">
              <input
                type="range"
                min={0}
                max={100}
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full h-1 bg-[#1c1c28] rounded-full appearance-none cursor-pointer accent-[#00c076]"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[#5a5a6a]">0</span>
                <span className="text-[10px] text-[#5a5a6a]">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Value */}
        <div>
          <span className="text-[11px] text-[#5a5a6a] mb-1 block">Order Value</span>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2">
            <span className="text-white text-sm font-mono">0</span>
            <div className="ml-auto w-6 h-6 rounded-full bg-[#00c076] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">$</span>
            </div>
          </div>
        </div>

        {/* Margin Required & Est. Liquidation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5a5a6a]">Margin Required</span>
            <span className="text-white">—</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5a5a6a]">Est. Liquidation Price</span>
            <span className="text-white">—</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button className="w-full py-2.5 bg-white text-black text-[13px] font-medium rounded hover:bg-gray-200 transition-colors">
            Sign up to trade
          </button>
          <button className="w-full py-2.5 border border-[#2a2a3a] text-white text-[13px] rounded hover:bg-[#1c1c28] transition-colors">
            Log in to trade
          </button>
        </div>

        {/* Order Options */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#1c1c28]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={postOnly}
              onChange={(e) => setPostOnly(e.target.checked)}
              className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
            />
            <span className="text-[11px] text-[#8a8a9a]">Post Only</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ioc}
              onChange={(e) => setIoc(e.target.checked)}
              className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
            />
            <span className="text-[11px] text-[#8a8a9a]">IOC</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
            />
            <span className="text-[11px] text-[#8a8a9a]">Reduce Only</span>
          </label>
        </div>

        {/* TP/SL */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={tpsl}
            onChange={(e) => setTpsl(e.target.checked)}
            className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
          />
          <span className="text-[11px] text-[#8a8a9a]">TP/SL</span>
        </label>
      </div>
    </div>
  );
}

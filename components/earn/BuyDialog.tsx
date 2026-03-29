"use client";

import { ExchangeOption } from "@/types/earn";
import { X, ArrowRight } from "lucide-react";

interface BuyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tokenName: string;
  exchanges: ExchangeOption[];
}

export default function BuyDialog({ isOpen, onClose, tokenName, exchanges }: BuyDialogProps) {
  if (!isOpen) return null;

  const directOption = exchanges.find((e) => e.id === "direct");
  const otherOptions = exchanges.filter((e) => e.id !== "direct");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12121a] border border-[#1c1c28] rounded-lg w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c28]">
          <h2 className="text-white text-[16px] font-semibold">Buy {tokenName}</h2>
          <button
            onClick={onClose}
            title="Close"
            className="text-[#5a5a6a] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Direct Buy */}
          {directOption && (
            <button className="w-full flex items-center justify-between px-4 py-3.5 bg-[#0E76FD] rounded-lg hover:bg-[#2d8afd] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[13px] font-bold">
                  {directOption.logo}
                </div>
                <span className="text-white text-[14px] font-mono font-semibold">
                  {directOption.name}
                </span>
              </div>
              <ArrowRight size={18} className="text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Other Platforms */}
          <div>
            <p className="text-[#5a5a6a] text-[12px] font-mono mb-3">Buy on other platforms</p>
            <div className="grid grid-cols-2 gap-2">
              {otherOptions.map((exchange) => (
                <button
                  key={exchange.id}
                  className="flex items-center justify-between px-4 py-3 bg-[#0b0b0e] border border-[#1c1c28] rounded-lg hover:bg-[#1c1c28] hover:border-[#2a2a3a] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ backgroundColor: exchange.color }}
                    >
                      {exchange.logo}
                    </div>
                    <span className="text-[#c0c0c0] text-[13px] font-mono">{exchange.name}</span>
                  </div>
                  <ArrowRight size={14} className="text-[#5a5a6a] group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

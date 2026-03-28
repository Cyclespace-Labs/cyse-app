"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Star, X } from "lucide-react";
import { tokenMarkets, TokenMarket } from "@/lib/tokenData";
import { formatVolume } from "@/lib/formatters";

const tabs = ["Spot", "Futures", "Lend"];

interface TokenPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenMarket) => void;
}

export default function TokenPickerDialog({
  isOpen,
  onClose,
  onSelect,
}: TokenPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Futures");
  const [sortBy, setSortBy] = useState<"volume" | "price" | "marketCap">("volume");
  const backdropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = tokenMarkets.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.pair.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "volume") return b.volume24h - a.volume24h;
    if (sortBy === "price") return b.price - a.price;
    return b.marketCap - a.marketCap;
  });

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-[580px] max-h-[80vh] bg-[#0b0b0e] border border-[#1c1c28] rounded-lg flex flex-col shadow-2xl shadow-black/50 animate-dialog-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-white text-sm font-semibold">Select Market</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#5a5a6a] hover:text-white transition-colors rounded hover:bg-[#1c1c28]"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-[#12121a] border border-[#1c1c28] rounded-lg px-3 py-2">
            <Search size={14} className="text-[#5a5a6a] shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets"
              className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-[#5a5a6a]"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[11px] rounded transition-colors ${
                activeTab === tab
                  ? "text-white bg-[#1c1c28]"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_100px_80px_50px] gap-2 px-4 py-1.5 border-b border-[#1c1c28] text-[10px] text-[#5a5a6a]">
          <button
            onClick={() => setSortBy("volume")}
            className={`text-left hover:text-[#8a8a9a] ${sortBy === "volume" ? "text-[#8a8a9a]" : ""}`}
          >
            Market / Volume ↓
          </button>
          <button
            onClick={() => setSortBy("price")}
            className={`text-right hover:text-[#8a8a9a] ${sortBy === "price" ? "text-[#8a8a9a]" : ""}`}
          >
            Price / Change
          </button>
          <button
            onClick={() => setSortBy("marketCap")}
            className={`text-right hover:text-[#8a8a9a] ${sortBy === "marketCap" ? "text-[#8a8a9a]" : ""}`}
          >
            Market Cap
          </button>
          <span />
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {sorted.map((token) => (
            <button
              key={token.symbol}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              className="w-full grid grid-cols-[1fr_100px_80px_50px] gap-2 items-center px-4 py-2.5 hover:bg-[#1c1c28]/60 transition-colors text-left group"
            >
              {/* Token info */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${token.iconColor}, ${token.iconSecondary})` }}
                >
                  {token.symbol.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[13px] font-medium truncate">
                      {token.pair}
                    </span>
                    {token.leverage && (
                      <span className="px-1 py-0.5 text-[9px] font-medium text-yellow-400 bg-yellow-400/10 rounded shrink-0">
                        {token.leverage}
                      </span>
                    )}
                    {token.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-1 py-0.5 text-[9px] font-medium text-[#00c076] bg-[#00c076]/10 rounded shrink-0"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[#5a5a6a] text-[10px]">
                    ${formatVolume(token.volume24h)}
                  </span>
                </div>
              </div>

              {/* Price / Change */}
              <div className="flex flex-col items-end">
                <span className="text-white text-[12px] font-mono">
                  {formatPrice(token.price)}
                </span>
                <span
                  className={`text-[11px] font-mono ${
                    token.change24h >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                  }`}
                >
                  {token.change24h >= 0 ? "+" : ""}
                  {token.change24h.toFixed(2)}%
                </span>
              </div>

              {/* Market Cap */}
              <div className="text-right">
                <span className="text-[#8a8a9a] text-[11px] font-mono">
                  ${formatVolume(token.marketCap)}
                </span>
              </div>

              {/* Favorite */}
              <div className="flex justify-end">
                <Star
                  size={14}
                  className={`transition-colors ${
                    token.isFavorite
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-[#2a2a3a] group-hover:text-[#5a5a6a]"
                  }`}
                />
              </div>
            </button>
          ))}

          {sorted.length === 0 && (
            <div className="flex items-center justify-center py-12 text-[#5a5a6a] text-[13px]">
              No markets found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

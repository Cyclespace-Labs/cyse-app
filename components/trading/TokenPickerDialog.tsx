"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Star, X, ShieldCheck } from "lucide-react";
import { tokenMarkets, TokenMarket } from "@/lib/tokenData";
import { formatVolume } from "@/lib/formatters";
import { useVaultWhitelist } from "@/hooks/useVaultWhitelist";

const tabs = ["Spot", "Futures", "Lend"];

// Tokens that have real chart data (Binance klines)
const CHART_SYMBOLS = new Set([
  "ETH", "BTC", "BNB", "SOL", "DOGE", "ARB", "OP", "PENGU",
  "XRP", "LINK", "AVAX", "SUI", "APT", "SEI", "WIF", "BONK",
  "HYPE", "JUP", "USDT",
]);

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
  const [whitelistOnly, setWhitelistOnly] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { whitelistedAddresses, isLoading: whitelistLoading } = useVaultWhitelist();

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

  const isTokenWhitelisted = (t: TokenMarket) =>
    !!t.indexAddress && whitelistedAddresses.has(t.indexAddress.toLowerCase());

  const filtered = tokenMarkets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.pair.toLowerCase().includes(q);
    if (activeTab === "Futures") {
      const passesWhitelist =
        !whitelistOnly || whitelistLoading || isTokenWhitelisted(t);
      return matchesSearch && passesWhitelist;
    }
    if (activeTab === "Spot") return matchesSearch && t.category === "spot";
    if (activeTab === "Lend") return matchesSearch && t.category === "lend";
    return matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
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
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs"
      style={{ background: "rgba(12,15,20,0.85)" }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        className="w-[580px] max-h-[80vh] rounded-lg flex flex-col animate-dialog-in surface-float"
        style={{ background: "var(--surface-container-low)", border: "1px solid rgba(66,70,84,0.4)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>Select Market</h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--on-surface-disabled)" }}
            title="Close"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "var(--surface-container)", borderBottom: "2px solid var(--outline-variant)" }}
          >
            <Search size={14} className="shrink-0" style={{ color: "var(--on-surface-disabled)" }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets"
              className="flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: "var(--on-surface)" }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 text-[11px] rounded transition-colors"
                style={{
                  color: activeTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)",
                  background: activeTab === tab ? "var(--surface-container-high)" : "transparent",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "Futures" && (
            <button
              onClick={() => setWhitelistOnly((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
              style={{
                color: whitelistOnly ? "var(--buy)" : "var(--on-surface-disabled)",
                background: whitelistOnly ? "rgba(0,192,118,0.1)" : "transparent",
                border: `1px solid ${whitelistOnly ? "rgba(0,192,118,0.3)" : "rgba(66,70,84,0.4)"}`,
              }}
              title={whitelistOnly ? "Showing vault-whitelisted only" : "Showing all markets"}
            >
              <ShieldCheck size={11} />
              Vault Pairs
            </button>
          )}
        </div>

        {/* Column Headers */}
        <div
          className="grid grid-cols-[1fr_100px_80px_50px] gap-2 px-4 py-1.5 text-[10px]"
          style={{ borderBottom: "1px solid rgba(66,70,84,0.4)", color: "var(--on-surface-disabled)" }}
        >
          <button
            onClick={() => setSortBy("volume")}
            className="text-left transition-colors"
            style={{ color: sortBy === "volume" ? "var(--on-surface-variant)" : "var(--on-surface-disabled)" }}
          >
            Market / Volume
          </button>
          <button
            onClick={() => setSortBy("price")}
            className="text-right transition-colors"
            style={{ color: sortBy === "price" ? "var(--on-surface-variant)" : "var(--on-surface-disabled)" }}
          >
            Price / Change
          </button>
          <button
            onClick={() => setSortBy("marketCap")}
            className="text-right transition-colors"
            style={{ color: sortBy === "marketCap" ? "var(--on-surface-variant)" : "var(--on-surface-disabled)" }}
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
              className="w-full grid grid-cols-[1fr_100px_80px_50px] gap-2 items-center px-4 py-2.5 transition-colors text-left group"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
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
                    <span className="text-[13px] font-medium truncate" style={{ color: "var(--on-surface)" }}>
                      {token.pair}
                    </span>
                    {(token.isLive || isTokenWhitelisted(token)) && (
                      <span
                        className="px-1 py-0.5 text-[9px] font-semibold rounded shrink-0"
                        style={{ color: "var(--buy)", background: "rgba(0,192,118,0.12)", border: "1px solid rgba(0,192,118,0.25)" }}
                      >
                        Live
                      </span>
                    )}
                    {CHART_SYMBOLS.has(token.symbol) && (
                      <span
                        className="px-1 py-0.5 text-[9px] font-semibold rounded shrink-0"
                        style={{ color: "var(--primary)", background: "rgba(14,118,253,0.1)", border: "1px solid rgba(14,118,253,0.2)" }}
                      >
                        Chart
                      </span>
                    )}
                  {token.leverage && (
                      <span
                        className="px-1 py-0.5 text-[9px] font-semibold rounded shrink-0"
                        style={{ color: "var(--tertiary)", background: "rgba(255,182,143,0.1)" }}
                      >
                        {token.leverage}
                      </span>
                    )}
                    {token.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-1 py-0.5 text-[9px] font-semibold rounded shrink-0"
                        style={{ color: "var(--buy)", background: "rgba(0,192,118,0.1)" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>
                    ${formatVolume(token.volume24h)}
                  </span>
                </div>
              </div>

              {/* Price / Change */}
              <div className="flex flex-col items-end">
                <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>
                  {formatPrice(token.price)}
                </span>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: token.change24h >= 0 ? "var(--buy)" : "var(--sell)" }}
                >
                  {token.change24h >= 0 ? "+" : ""}
                  {token.change24h.toFixed(2)}%
                </span>
              </div>

              {/* Market Cap */}
              <div className="text-right">
                <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-muted)" }}>
                  ${formatVolume(token.marketCap)}
                </span>
              </div>

              {/* Favorite */}
              <div className="flex justify-end">
                <Star
                  size={14}
                  className="transition-colors"
                  style={{
                    color: token.isFavorite ? "var(--tertiary)" : "var(--outline-variant)",
                    fill: token.isFavorite ? "var(--tertiary)" : "none",
                  }}
                />
              </div>
            </button>
          ))}

          {sorted.length === 0 && (
            <div className="flex items-center justify-center py-12 text-[13px]" style={{ color: "var(--on-surface-disabled)" }}>
              No markets found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

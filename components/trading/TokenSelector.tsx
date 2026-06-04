"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { contracts } from "@/lib/protocol/contracts";
import { Button } from "../ui/button";

const TOKEN_CONFIG = {
  WETH: { address: contracts.weth.address, decimals: 18, symbol: "WETH", name: "Wrapped Ether" },
  USDC: { address: contracts.usdc.address, decimals: 6, symbol: "USDC", name: "USD Coin" },
  USDT: { address: contracts.usdt.address, decimals: 6, symbol: "USDT", name: "Tether" },
  BTC: { address: contracts.btc.address, decimals: 8, symbol: "BTC", name: "Bitcoin" },
};

const COLLATERAL_TOKENS = ["WETH", "USDC", "USDT", "BTC"];
const INDEX_TOKENS = ["WETH", "BTC"];

const TOKEN_ICONS: Record<string, string> = {
  WETH: "/tokens/Ethereum ETH.svg",
  USDC: "/tokens/USD Coin.svg",
  USDT: "/tokens/Tether.svg",
  BTC: "/tokens/Bitcoin.svg",
};

type CollateralTokenKey = "WETH" | "USDC" | "USDT" | "BTC";
type IndexTokenKey = "WETH" | "BTC";

interface TokenSelectorProps {
  selectedCollateralTokenKey: CollateralTokenKey;
  onCollateralTokenChange: (token: CollateralTokenKey) => void;
  selectedIndexTokenKey: IndexTokenKey;
  onIndexTokenChange: (token: IndexTokenKey) => void;
}

export default function TokenSelector({
  selectedCollateralTokenKey,
  onCollateralTokenChange,
  selectedIndexTokenKey,
  onIndexTokenChange,
}: TokenSelectorProps) {
  const collateralDropdownRef = useRef<HTMLDivElement>(null);
  const indexDropdownRef = useRef<HTMLDivElement>(null);
  const [collateralDropdownOpen, setCollateralDropdownOpen] = useState(false);
  const [indexDropdownOpen, setIndexDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collateralDropdownRef.current && !collateralDropdownRef.current.contains(e.target as Node)) {
        setCollateralDropdownOpen(false);
      }
      if (indexDropdownRef.current && !indexDropdownRef.current.contains(e.target as Node)) {
        setIndexDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      
      {/*--- Collateral Token */}
      <div ref={collateralDropdownRef} className="relative">

        <label className="text-[11px] text-on-surface-muted mb-1 block">Collateral</label>

        <button
          onClick={() => { setCollateralDropdownOpen((v) => !v); setIndexDropdownOpen(false); }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors bg-surface-container dark:bg-surface-low 
          border border-outline/50 dark:border-surface-container/60"
          style={{
            background: collateralDropdownOpen ? "var(--surface-container)" : "",
          }}
        >
          {TOKEN_ICONS[selectedCollateralTokenKey] ? (
            <img src={TOKEN_ICONS[selectedCollateralTokenKey]} alt={selectedCollateralTokenKey} className="w-4 h-4 rounded-full shrink-0 object-contain" />
          ) : (
            <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white text-[8px] font-bold" style={{ background: "var(--primary)" }}>
              {selectedCollateralTokenKey.charAt(0)}
            </div>
          )}
          <span className="flex-1 text-left text-[11px] font-mono">{TOKEN_CONFIG[selectedCollateralTokenKey].symbol}</span>
          <ChevronDown
            size={11}
            className="shrink-0 transition-transform"
            style={{ color: "var(--on-surface-disabled)", transform: collateralDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        {collateralDropdownOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-lg z-20 overflow-hidden bg-surface-low border border-outline shadow-sm w-[260px]"
          >

            {COLLATERAL_TOKENS.map((token) => {
              const cfg = TOKEN_CONFIG[token as keyof typeof TOKEN_CONFIG];
              const isSelected = token === selectedCollateralTokenKey;
              return (
                <button
                  key={token}
                  onClick={() => { onCollateralTokenChange(token as CollateralTokenKey); setCollateralDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
                  style={{ background: isSelected ? "var(--surface-container)" : "transparent" }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {TOKEN_ICONS[token] ? (
                    <img src={TOKEN_ICONS[token]} alt={token} className="w-5 h-5 rounded-full shrink-0 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "var(--primary)" }}>
                      {token.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] font-medium" style={{ color: isSelected ? "var(--primary)" : "var(--on-surface)" }}>{cfg.symbol}</span>
                    <span className="text-[9px]" style={{ color: "var(--on-surface-disabled)" }}>{cfg.name}</span>
                  </div>
                  {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full hidden" style={{ background: "var(--primary)" }} />}
                </button>
              );
            })}
            
          </div>

        )}

      </div>

      {/* Index Token */}
      <div ref={indexDropdownRef} className="relative">
        <label className="text-[11px] mb-1 block text-on-surface-muted">Index Token</label>
        <button
          onClick={() => { setIndexDropdownOpen((v) => !v); setCollateralDropdownOpen(false); }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors bg-surface-container dark:bg-surface-low 
          border border-outline/50 dark:border-surface-container/60"
          style={{
            background: indexDropdownOpen ? "var(--surface-container)" : "",
          }}
        >
          {TOKEN_ICONS[selectedIndexTokenKey] ? (
            <img src={TOKEN_ICONS[selectedIndexTokenKey]} alt={selectedIndexTokenKey} className="w-4 h-4 rounded-full shrink-0 object-contain" />
          ) : (
            <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white text-[8px] font-bold" style={{ background: "var(--primary)" }}>
              {selectedIndexTokenKey.charAt(0)}
            </div>
          )}
          <span className="flex-1 text-left text-[11px] font-mono">{TOKEN_CONFIG[selectedIndexTokenKey].symbol}</span>
          <ChevronDown
            size={11}
            className="shrink-0 transition-transform"
            style={{ color: "var(--on-surface-disabled)", transform: indexDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {indexDropdownOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-lg z-20 overflow-hidden"
            style={{ background: "var(--surface-container-low)", border: "1px solid rgba(66,70,84,0.5)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
          >
            {INDEX_TOKENS.map((token) => {
              const cfg = TOKEN_CONFIG[token as keyof typeof TOKEN_CONFIG];
              const isSelected = token === selectedIndexTokenKey;
              return (
                <button
                  key={token}
                  onClick={() => { onIndexTokenChange(token as IndexTokenKey); setIndexDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
                  style={{ background: isSelected ? "var(--surface-container)" : "transparent" }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {TOKEN_ICONS[token] ? (
                    <img src={TOKEN_ICONS[token]} alt={token} className="w-5 h-5 rounded-full shrink-0 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "var(--primary)" }}>
                      {token.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] font-medium" style={{ color: isSelected ? "var(--primary)" : "var(--on-surface)" }}>{cfg.symbol}</span>
                    <span className="text-[9px]" style={{ color: "var(--on-surface-disabled)" }}>{cfg.name}</span>
                  </div>
                  {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

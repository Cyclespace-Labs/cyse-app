"use client";

import { useState } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import StatsCards from "@/components/earn/StatsCards";
import RecommendedSection from "@/components/earn/RecommendedSection";
import DiscoverSection from "@/components/earn/DiscoverSection";
import BuyDialog from "@/components/earn/BuyDialog";
import {
  portfolioStats,
  recommendedOpportunities,
  infoCards,
  faqItems,
  yieldLandscape,
  exchangeOptions,
} from "@/lib/earnData";
import { Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

const earnTabs = ["Portfolio", "Discover", "Additional opportunities", "Distributions", "Buyback Tracker"];

export default function EarnPage() {
  const { wallet, connect } = useWallet();
  const [activeTab, setActiveTab] = useState("Portfolio");
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [buyTokenName, setBuyTokenName] = useState("CYSE");

  const handleBuyClick = (type: string) => {
    setBuyTokenName(type === "GMX" ? "CYSE" : type);
    setShowBuyDialog(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <TopNavigation />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Page Header */}
        <div className="px-5 pt-5 pb-2">
          <h1 className="text-[26px] font-semibold" style={{ color: "var(--on-surface)" }}>Earn</h1>
          <p className="text-[13px] font-mono mt-1" style={{ color: "var(--on-surface-disabled)" }}>
            Stake CYSE and buy GLV or GM to earn rewards
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pb-3">
          {earnTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 text-[12px] font-mono rounded transition-colors"
              style={{
                background: activeTab === tab ? "var(--primary)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--on-surface-muted)",
                fontWeight: activeTab === tab ? 500 : undefined,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <StatsCards stats={portfolioStats} />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === "Portfolio" && (
            <>
              <RecommendedSection
                opportunities={recommendedOpportunities}
                onBuyClick={handleBuyClick}
              />

              {/* My Assets */}
              <div className="px-5 py-4">
                <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>My assets</h2>
                {!wallet.connected ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 rounded-lg"
                    style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}
                  >
                    <Wallet size={32} className="mb-3" style={{ color: "var(--on-surface-disabled)" }} />
                    <p className="text-[13px] font-mono mb-4" style={{ color: "var(--on-surface-disabled)" }}>
                      Connect wallet to see your assets
                    </p>
                    <button
                      onClick={connect}
                      className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-mono font-semibold rounded btn-primary-gradient"
                    >
                      <Wallet size={15} />
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}
                  >
                    <div className="grid grid-cols-4 gap-0 text-[10px] font-mono uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
                      <span>Asset</span><span>Balance</span><span>Value</span><span>APY</span>
                    </div>
                    <div className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--primary)", color: "#fff" }}>C</div>
                        <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>CYSE</span>
                      </div>
                      <span className="flex-1 text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{wallet.cyseBalance.toLocaleString()}</span>
                      <span className="flex-1 text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>${(wallet.cyseBalance * 0.42).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span className="flex-1 text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>Accumulating</span>
                    </div>
                    <div className="flex items-center px-4 py-3">
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#6366f1", color: "#fff" }}>S</div>
                        <span className="text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>Staked CYSE</span>
                      </div>
                      <span className="flex-1 text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>{wallet.stakedCyse.toLocaleString()}</span>
                      <span className="flex-1 text-[12px] font-mono" style={{ color: "var(--on-surface)" }}>${(wallet.stakedCyse * 0.42).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span className="flex-1 text-[12px] font-mono" style={{ color: "var(--buy)" }}>+${ wallet.pendingRewards.toFixed(2) } pending</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "Discover" && (
            <DiscoverSection
              infoCards={infoCards}
              faqItems={faqItems}
              yieldLandscape={yieldLandscape}
              onBuyClick={handleBuyClick}
            />
          )}

          {activeTab === "Additional opportunities" && (
            <div className="flex items-center justify-center py-20 text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Additional earning opportunities coming soon
            </div>
          )}

          {activeTab === "Distributions" && (
            <div className="flex items-center justify-center py-20 text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Distribution history will appear here
            </div>
          )}

          {activeTab === "Buyback Tracker" && (
            <div className="flex items-center justify-center py-20 text-[13px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Buyback tracking data coming soon
            </div>
          )}
        </div>
      </div>

      <BottomTicker />

      <BuyDialog
        isOpen={showBuyDialog}
        onClose={() => setShowBuyDialog(false)}
        tokenName={buyTokenName}
        exchanges={exchangeOptions}
      />
    </div>
  );
}

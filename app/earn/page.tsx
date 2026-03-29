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

const earnTabs = ["Portfolio", "Discover", "Additional opportunities", "Distributions", "Buyback Tracker"];

export default function EarnPage() {
  const [activeTab, setActiveTab] = useState("Portfolio");
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [buyTokenName, setBuyTokenName] = useState("CYSE");

  const handleBuyClick = (type: string) => {
    setBuyTokenName(type === "GMX" ? "CYSE" : type);
    setShowBuyDialog(true);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <TopNavigation />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Page Header */}
        <div className="px-5 pt-5 pb-2">
          <h1 className="text-white text-[26px] font-semibold">Earn</h1>
          <p className="text-[#5a5a6a] text-[13px] font-mono mt-1">
            Stake CYSE and buy GLV or GM to earn rewards
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pb-3">
          {earnTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[12px] font-mono rounded transition-colors ${
                activeTab === tab
                  ? "bg-[#0E76FD] text-white font-medium"
                  : "text-[#8a8a9a] hover:text-white hover:bg-[#1c1c28]"
              }`}
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
                <h2 className="text-white text-[15px] font-semibold mb-4">My assets</h2>
                <div className="flex flex-col items-center justify-center py-16 bg-[#12121a] border border-[#1c1c28] rounded-lg">
                  <Wallet size={32} className="text-[#5a5a6a] mb-3" />
                  <p className="text-[#5a5a6a] text-[13px] font-mono mb-4">
                    Connect wallet to see your assets
                  </p>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0E76FD] text-white text-[13px] font-mono font-semibold rounded hover:bg-[#2d8afd] transition-colors">
                    <Wallet size={15} />
                    Connect wallet
                  </button>
                </div>
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
            <div className="flex items-center justify-center py-20 text-[#5a5a6a] text-[13px] font-mono">
              Additional earning opportunities coming soon
            </div>
          )}

          {activeTab === "Distributions" && (
            <div className="flex items-center justify-center py-20 text-[#5a5a6a] text-[13px] font-mono">
              Distribution history will appear here
            </div>
          )}

          {activeTab === "Buyback Tracker" && (
            <div className="flex items-center justify-center py-20 text-[#5a5a6a] text-[13px] font-mono">
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

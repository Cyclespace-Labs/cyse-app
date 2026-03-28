"use client";

import { useState } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import PredictionsSidebar from "@/components/predictions/PredictionsSidebar";
import PredictionCard from "@/components/predictions/PredictionCard";
import { predictionMarkets } from "@/lib/predictionsData";
import { Search } from "lucide-react";

const filterTabs = ["All", "Up / Down", "Above / Below", "Price Range", "Hit Price"];

export default function PredictionsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = predictionMarkets.filter((m) => {
    const matchesCategory = activeCategory === "All" || m.category === activeCategory || m.timeframe === activeCategory;
    const matchesSearch = search === "" || m.question.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <PredictionsSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c28] bg-[#0b0b0e]">
            <div className="flex items-center gap-3">
              <h1 className="text-white text-lg font-semibold font-mono">
                <span className="text-[#00c076]">&gt;</span> Crypto
              </h1>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 ml-3">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-2.5 py-1 text-[11px] rounded font-mono transition-colors ${
                      activeFilter === tab
                        ? "text-black bg-[#00c076] font-medium"
                        : "text-[#5a5a6a] hover:text-[#8a8a9a] hover:bg-[#1c1c28]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-[#12121a] border border-[#1c1c28] rounded px-3 py-1.5 w-[280px]">
              <Search size={13} className="text-[#5a5a6a] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search predictions..."
                className="flex-1 bg-transparent text-white text-[12px] font-mono outline-none placeholder:text-[#5a5a6a]"
              />
            </div>
          </div>

          {/* Terminal Status Bar */}
          <div className="flex items-center gap-4 px-5 py-1.5 border-b border-[#1c1c28] bg-[#080810] text-[10px] font-mono">
            <span className="text-[#00c076]">● SYSTEM ONLINE</span>
            <span className="text-[#5a5a6a]">|</span>
            <span className="text-[#5a5a6a]">
              MARKETS: <span className="text-white">{filtered.length}</span>
            </span>
            <span className="text-[#5a5a6a]">|</span>
            <span className="text-[#5a5a6a]">
              FILTER: <span className="text-[#00c076]">{activeCategory.toUpperCase()}</span>
            </span>
            <span className="text-[#5a5a6a]">|</span>
            <span className="text-[#5a5a6a]">
              TOTAL VOL: <span className="text-white">$142.8M</span>
            </span>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[#5a5a6a]">BLOCK:</span>
              <span className="text-[#00c076]">19,847,231</span>
              <span className="text-[#5a5a6a] animate-pulse">█</span>
            </div>
          </div>

          {/* Predictions Grid */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((market) => (
                  <PredictionCard key={market.id} market={market} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#5a5a6a]">
                <div className="font-mono text-sm mb-2">
                  <span className="text-[#00c076]">&gt;</span> NO_MARKETS_FOUND
                </div>
                <span className="text-[11px] font-mono">
                  Try adjusting your filters or search query
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Ticker */}
      <BottomTicker />
    </div>
  );
}

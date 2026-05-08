"use client";

import { useState, useEffect } from "react";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import PredictionsSidebar from "@/components/predictions/PredictionsSidebar";
import PredictionCard from "@/components/predictions/PredictionCard";
import { getPredictionMarkets, getPredictionCategories } from "@/lib/predictionsData";
import { PredictionMarket, PredictionCategory } from "@/types/predictions";
import { Search } from "lucide-react";

const filterTabs = ["All", "Up / Down", "Above / Below", "Price Range", "Hit Price"];

export default function PredictionsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [categories, setCategories] = useState<PredictionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [marketsData, categoriesData] = await Promise.all([
          getPredictionMarkets(100),
          getPredictionCategories(),
        ]);
        setMarkets(marketsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading predictions data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = markets.filter((m) => {
    const matchesCategory = activeCategory === "All" || m.category === activeCategory || m.timeframe === activeCategory;
    const matchesSearch = search === "" || m.question.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
        <TopNavigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm" style={{ color: "var(--on-surface-disabled)" }}>
            Loading markets...
          </div>
        </div>
        <BottomTicker />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <PredictionsSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)", background: "var(--surface-container-lowest)" }}>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold font-mono" style={{ color: "var(--on-surface)" }}>
                <span style={{ color: "var(--primary)" }}>&gt;</span> Crypto
              </h1>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 ml-3">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className="px-2.5 py-1 text-[11px] rounded font-mono transition-colors"
                    style={{
                      background: activeFilter === tab ? "var(--primary)" : "transparent",
                      color: activeFilter === tab ? "#000" : "var(--on-surface-disabled)",
                      fontWeight: activeFilter === tab ? 500 : undefined,
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded px-3 py-1.5 w-[280px]" style={{ background: "var(--surface-container-low)", border: "1px solid rgba(66,70,84,0.4)" }}>
              <Search size={13} className="shrink-0" style={{ color: "var(--on-surface-disabled)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search predictions..."
                className="flex-1 bg-transparent text-[12px] font-mono outline-none"
                style={{ color: "var(--on-surface)" }}
              />
            </div>
          </div>

          {/* Terminal Status Bar */}
          <div className="flex items-center gap-4 px-5 py-1.5 text-[10px] font-mono" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)", background: "var(--surface-container-lowest)" }}>
            <span style={{ color: "var(--primary)" }}>● SYSTEM ONLINE</span>
            <span style={{ color: "var(--on-surface-disabled)" }}>|</span>
            <span style={{ color: "var(--on-surface-disabled)" }}>
              MARKETS: <span style={{ color: "var(--on-surface)" }}>{filtered.length}</span>
            </span>
            <span style={{ color: "var(--on-surface-disabled)" }}>|</span>
            <span style={{ color: "var(--on-surface-disabled)" }}>
              FILTER: <span style={{ color: "var(--primary)" }}>{activeCategory.toUpperCase()}</span>
            </span>
            <span style={{ color: "var(--on-surface-disabled)" }}>|</span>
            <span style={{ color: "var(--on-surface-disabled)" }}>
              TOTAL VOL: <span style={{ color: "var(--on-surface)" }}>$142.8M</span>
            </span>
            <div className="ml-auto flex items-center gap-1">
              <span style={{ color: "var(--on-surface-disabled)" }}>BLOCK:</span>
              <span style={{ color: "var(--primary)" }}>19,847,231</span>
              <span className="animate-pulse" style={{ color: "var(--on-surface-disabled)" }}>█</span>
            </div>
          </div>

          {/* Predictions Grid */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {filtered.map((market) => (
                  <PredictionCard key={market.id} market={market} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--on-surface-disabled)" }}>
                <div className="font-mono text-sm mb-2">
                  <span style={{ color: "var(--primary)" }}>&gt;</span> NO_MARKETS_FOUND
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

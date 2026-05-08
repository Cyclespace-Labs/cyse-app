"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import TopNavigation from "@/components/trading/TopNavigation";
import BottomTicker from "@/components/trading/BottomTicker";
import MarketHeader from "@/components/predictions/MarketHeader";
import ProbabilityChart from "@/components/predictions/ProbabilityChart";
import PredictionOrderBook from "@/components/predictions/PredictionOrderBook";
import PredictionTradingPanel from "@/components/predictions/PredictionTradingPanel";
import RelatedMarkets from "@/components/predictions/RelatedMarkets";
import MarketActivitySection from "@/components/predictions/MarketActivity";
import { getPredictionById, getRelatedPredictions } from "@/lib/predictionsDetailData";
import { PredictionMarketDetail } from "@/types/predictions";

export default function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [market, setMarket] = useState<PredictionMarketDetail | null>(null);
  const [relatedMarkets, setRelatedMarkets] = useState<PredictionMarketDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const marketData = await getPredictionById(id);
        if (!marketData) {
          notFound();
          return;
        }
        setMarket(marketData);

        const relatedData = await getRelatedPredictions(id);
        setRelatedMarkets(relatedData);
      } catch (error) {
        console.error('Error loading market data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
        <TopNavigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm" style={{ color: "var(--on-surface-disabled)" }}>
            Loading market data...
          </div>
        </div>
        <BottomTicker />
      </div>
    );
  }

  if (!market) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <TopNavigation />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Market Header */}
        <MarketHeader market={market} />

        {/* Main Content */}
        <div className="flex gap-0 min-h-0">
          {/* Left: Chart + Order Book + Comments */}
          <div className="flex-1 min-w-0">
            {/* Chart */}
            <ProbabilityChart key={`chart-${id}`} data={market.priceHistory} color={market.iconColor} />

            {/* Order Book */}
            <div className="p-4">
              <PredictionOrderBook market={market} />
            </div>

            {/* Comments & Activity */}
            <div className="p-4 pt-0">
              <MarketActivitySection
                comments={market.comments}
                topHolders={market.topHolders}
                recentActivity={market.recentActivity}
              />
            </div>
          </div>

          {/* Right Sidebar: Trading Panel + Related Markets */}
          <div className="w-[320px] shrink-0 p-4 space-y-4 overflow-y-auto scrollbar-hide" style={{ borderLeft: "1px solid rgba(66,70,84,0.4)" }}>
            <PredictionTradingPanel market={market} />

            {relatedMarkets.length > 0 && (
              <div>
                <h3 className="text-[11px] font-mono uppercase mb-3" style={{ color: "var(--on-surface-disabled)" }}>
                  Related Markets
                </h3>
                <RelatedMarkets markets={relatedMarkets} />
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomTicker />
    </div>
  );
}

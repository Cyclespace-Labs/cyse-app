"use client";

import { use } from "react";
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

export default function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const market = getPredictionById(id);

  if (!market) {
    notFound();
  }

  const relatedMarkets = getRelatedPredictions(id);

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
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
          <div className="w-[320px] shrink-0 border-l border-[#1c1c28] p-4 space-y-4 overflow-y-auto scrollbar-hide">
            <PredictionTradingPanel market={market} />

            {relatedMarkets.length > 0 && (
              <div>
                <h3 className="text-[#5a5a6a] text-[11px] font-mono uppercase mb-3">
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

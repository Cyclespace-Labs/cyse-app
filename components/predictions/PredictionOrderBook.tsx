"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PredictionMarketDetail, OrderBookLevel } from "@/types/predictions";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";

interface PredictionOrderBookProps {
  market: PredictionMarketDetail;
}

const inlineTabs = ["Order Book", "Graph", "Resolution"];
const infoTabs = ["Rules", "Market Context"];

// ── Per-price-level expandable row inside the inline order book ──────────────
function PriceLevelRow({
  level,
  side,
  maxShares,
  onPriceClick,
}: {
  level: OrderBookLevel;
  side: "ask" | "bid";
  maxShares: number;
  onPriceClick: (price: number, tradeSide: "buy" | "sell") => void;
}) {
  const [open, setOpen] = useState(false);
  const depthPct = maxShares > 0 ? (level.shares / maxShares) * 100 : 0;
  const isAsk = side === "ask";
  const priceColor = isAsk ? "text-[#ff6b6b]" : "text-[#00c076]";
  const depthBg   = isAsk ? "bg-[#ff4d4f]/10" : "bg-[#00c076]/10";
  const accentBorder = isAsk ? "border-l-[#ff4d4f]" : "border-l-[#00c076]";

  return (
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 ${depthBg} pointer-events-none`}
        style={{ width: `${Math.min(depthPct, 100)}%` }}
      />
      <div
        onClick={() => level.orders.length > 1 && setOpen(!open)}
        className={`relative flex items-center px-3 py-1.5 transition-colors hover:bg-[#1c1c28]/40 ${
          level.orders.length > 1 ? "cursor-pointer" : "cursor-default"
        } ${open ? `border-l-2 ${accentBorder}` : "border-l-2 border-l-transparent"}`}
      >
        <div className="w-4 shrink-0 text-[#5a5a6a]">
          {level.orders.length > 1 ? (
            open ? <ChevronDown size={11} /> : <ChevronRight size={11} />
          ) : null}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPriceClick(level.price, isAsk ? "sell" : "buy"); }}
          className={`w-20 text-left text-[12px] font-mono font-medium ${priceColor} hover:underline`}
        >
          {level.price.toFixed(1)}&cent;
        </button>
        <span className="flex-1 text-right text-[12px] font-mono text-[#c0c0c0]">
          {level.shares.toFixed(2)}
        </span>
        <span className="flex-1 text-right text-[12px] font-mono text-[#c0c0c0]">
          ${level.total.toFixed(2)}
        </span>
      </div>
      {open && level.orders.map((order) => (
        <div
          key={order.id}
          className={`flex items-center px-3 py-1 pl-7 text-[11px] font-mono text-[#8a8a9a] bg-[#0a0a10] border-l-2 ${accentBorder}`}
        >
          <span className="w-4 shrink-0" />
          <span className="w-24 text-[#5a5a6a] truncate">{order.maker}</span>
          <span className="flex-1 text-right">{order.shares.toFixed(2)}</span>
          <span className="flex-1 text-right">${(order.shares * order.price / 100).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Inline expanded order book panel (shown under an option row) ─────────────
function InlineOrderBook({
  market,
  onPriceClick,
}: {
  market: PredictionMarketDetail;
  onPriceClick: (price: number, side: "buy" | "sell") => void;
}) {
  const [activeTab, setActiveTab] = useState("Order Book");
  const ob = market.orderBookData;
  const allShares = [
    ...(ob?.asks ?? []).map((l) => l.shares),
    ...(ob?.bids ?? []).map((l) => l.shares),
  ];
  const maxShares = Math.max(...allShares, 1);

  return (
    <div className="border-t border-[#1c1c28] bg-[#0d0d12]">
      {/* Sub-tabs */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1c1c28]">
        {inlineTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[11px] font-mono font-medium pb-0.5 transition-colors ${
              activeTab === tab
                ? "text-white border-b border-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Order Book" && ob ? (
        <>
          {/* Column headers */}
          <div className="flex items-center px-3 py-1.5 text-[10px] font-mono text-[#5a5a6a] uppercase tracking-wider border-b border-[#1c1c28]">
            <div className="w-4 shrink-0" />
            <Filter size={9} className="mr-1 shrink-0" />
            <span className="w-20">TRADE YES</span>
            <span className="flex-1 text-right">PRICE</span>
            <span className="flex-1 text-right">SHARES</span>
            <span className="flex-1 text-right">TOTAL</span>
          </div>

          {/* Asks */}
          {ob.asks.map((level, i) => (
            <PriceLevelRow key={`ask-${i}`} level={level} side="ask" maxShares={maxShares} onPriceClick={onPriceClick} />
          ))}

          {/* Last / Spread */}
          <div className="flex items-center justify-between px-4 py-1.5 border-y border-[#1c1c28]">
            <span className="text-[10px] font-mono text-[#5a5a6a]">
              Last: <span className="text-white">{ob.lastPrice.toFixed(1)}&cent;</span>
            </span>
            <span className="text-[10px] font-mono text-[#5a5a6a]">
              Spread: <span className="text-white">{ob.spread.toFixed(1)}&cent;</span>
            </span>
          </div>

          {/* Bids */}
          {ob.bids.map((level, i) => (
            <PriceLevelRow key={`bid-${i}`} level={level} side="bid" maxShares={maxShares} onPriceClick={onPriceClick} />
          ))}
        </>
      ) : activeTab === "Resolution" ? (
        <p className="px-4 py-3 text-[11px] font-mono text-[#8a8a9a] leading-relaxed">
          {market.resolutionCriteria || "This market resolves based on the official price at expiry."}
        </p>
      ) : (
        <p className="px-4 py-3 text-[11px] font-mono text-[#5a5a6a] text-center">Graph view coming soon</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PredictionOrderBook({ market }: PredictionOrderBookProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedOption, setExpandedOption] = useState<number | null>(null);
  const [activeInfoTab, setActiveInfoTab] = useState("Rules");

  const isHitPrice = market.options.length > 2;
  const formattedVolume = market.totalVolume
    ? `$${(market.totalVolume / 1000000).toFixed(1)}M Vol.`
    : market.volume;

  const handlePriceClick = (price: number, side: "buy" | "sell") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("side", side);
    params.set("price", price.toFixed(1));
    params.set("orderType", "limit");
    if (!params.get("option")) params.set("option", "0");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOptionBuy = (
    e: React.MouseEvent,
    optionIndex: number,
    side: "buy" | "sell",
    price?: number,
  ) => {
    e.stopPropagation();
    const params = new URLSearchParams(searchParams.toString());
    params.set("side", side);
    params.set("option", String(optionIndex));
    if (price !== undefined) {
      params.set("price", price.toFixed(1));
      params.set("orderType", "limit");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c28]">
        <div className="flex items-center gap-2">
          <span className="text-white text-[13px] font-medium font-mono">Order Book</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c076]" />
        </div>
        <span className="text-[#5a5a6a] text-[11px] font-mono">{formattedVolume}</span>
      </div>

      {/* Options list */}
      {isHitPrice ? (
        <div className="overflow-y-auto scrollbar-hide">
          {market.options.map((option, i) => (
            <div key={i} className="border-b border-[#1c1c28] last:border-b-0">
              {/* Option row */}
              <div
                onClick={() => setExpandedOption(expandedOption === i ? null : i)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1c1c28]/30 transition-colors"
              >
                {/* Arrow toggle */}
                <span className="text-[#5a5a6a] shrink-0">
                  {expandedOption === i
                    ? <ChevronDown size={13} />
                    : <ChevronRight size={13} />}
                </span>

                {/* Label + volume */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span
                    className={`text-[13px] font-mono font-medium leading-none ${
                      option.direction === "up" ? "text-[#00c076]" : "text-[#ff4d4f]"
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.volume && (
                    <span className="text-[#5a5a6a] text-[10px] font-mono">{option.volume}</span>
                  )}
                </div>

                {/* Percentage */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-white text-[13px] font-mono font-semibold">
                    {option.percentage < 1 ? "<1%" : `${option.percentage}%`}
                  </span>
                  {option.percentage > 1 && (
                    <span className="text-[#ff4d4f] text-[10px] font-mono">
                      ▼{(option.percentage * 0.3).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Buy Yes / Buy No buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleOptionBuy(e, i, "buy", option.yesPrice)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-semibold bg-[#00c076]/15 text-[#00c076] border border-[#00c076]/25 rounded hover:bg-[#00c076]/25 transition-colors whitespace-nowrap"
                  >
                    Buy Yes {option.yesPrice !== undefined ? `${option.yesPrice}¢` : "0.2¢"}
                  </button>
                  <button
                    onClick={(e) => handleOptionBuy(e, i, "sell", option.noPrice)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-semibold bg-[#ff4d4f]/15 text-[#ff4d4f] border border-[#ff4d4f]/25 rounded hover:bg-[#ff4d4f]/25 transition-colors whitespace-nowrap"
                  >
                    Buy No {option.noPrice !== undefined ? `${option.noPrice}¢` : "99.9¢"}
                  </button>
                </div>
              </div>

              {/* Inline order book (expanded) */}
              {expandedOption === i && (
                <InlineOrderBook market={market} onPriceClick={handlePriceClick} />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Simple Up / Down */
        <div className="px-4 py-3">
          {market.options.map((option, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    option.direction === "up" ? "bg-[#00c076]" : "bg-[#ff4d4f]"
                  }`}
                />
                <span className="text-white text-[13px] font-mono font-medium">{option.label}</span>
              </div>
              <span className="text-white text-[13px] font-mono font-semibold">{option.percentage}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Rules / Market Context */}
      <div className="border-t border-[#1c1c28]">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1c1c28]">
          {infoTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveInfoTab(tab)}
              className={`text-[12px] font-mono transition-colors pb-1 ${
                activeInfoTab === tab
                  ? "text-white border-b border-white"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 text-[11px] font-mono text-[#8a8a9a] leading-relaxed">
          {activeInfoTab === "Rules" ? (
            <p>{market.resolutionCriteria || "This market resolves based on the official price at expiry."}</p>
          ) : (
            <p>{market.description || "No additional context available for this market."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PredictionMarketDetail, OrderBookLevel } from "@/types/predictions";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { usePolymarketOrderBook } from "@/hooks/usePolymarketRealtime";

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
  const priceColor = isAsk ? "var(--sell)" : "var(--buy)";
  const depthBg   = isAsk ? "rgba(255,77,79,0.1)" : "rgba(0,192,118,0.1)";
  const accentBorderColor = isAsk ? "var(--sell)" : "var(--buy)";

  return (
    <div className="relative">
      <div
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{ width: `${Math.min(depthPct, 100)}%`, background: depthBg }}
      />
      <div
        onClick={() => level.orders.length > 1 && setOpen(!open)}
        className={`relative flex items-center px-3 py-1.5 transition-colors border-l-2 ${
          level.orders.length > 1 ? "cursor-pointer" : "cursor-default"
        }`}
        style={{ borderLeftColor: open ? accentBorderColor : "transparent" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <div className="w-4 shrink-0" style={{ color: "var(--on-surface-disabled)" }}>
          {level.orders.length > 1 ? (
            open ? <ChevronDown size={11} /> : <ChevronRight size={11} />
          ) : null}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPriceClick(level.price, isAsk ? "sell" : "buy"); }}
          className="w-20 text-left text-[12px] font-mono font-medium hover:underline"
          style={{ color: priceColor }}
        >
          {level.price.toFixed(1)}&cent;
        </button>
        <span className="flex-1 text-right text-[12px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
          {level.shares.toFixed(2)}
        </span>
        <span className="flex-1 text-right text-[12px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
          ${level.total.toFixed(2)}
        </span>
      </div>
      {open && level.orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center px-3 py-1 pl-7 text-[11px] font-mono border-l-2"
          style={{ color: "var(--on-surface-muted)", background: "var(--surface-container-lowest)", borderLeftColor: accentBorderColor }}
        >
          <span className="w-4 shrink-0" />
          <span className="w-24 truncate" style={{ color: "var(--on-surface-disabled)" }}>{order.maker}</span>
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
  orderBookData,
  onPriceClick,
}: {
  market: PredictionMarketDetail;
  orderBookData: any;
  onPriceClick: (price: number, side: "buy" | "sell") => void;
}) {
  const [activeTab, setActiveTab] = useState("Order Book");
  const ob = orderBookData;
  const allShares = [
    ...(ob?.asks ?? []).map((l: any) => l.shares),
    ...(ob?.bids ?? []).map((l: any) => l.shares),
  ];
  const maxShares = Math.max(...allShares, 1);

  return (
    <div style={{ borderTop: "1px solid rgba(66,70,84,0.4)", background: "var(--surface-container)" }}>
      {/* Sub-tabs */}
      <div className="flex items-center gap-4 px-4 py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {inlineTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="text-[11px] font-mono font-medium pb-0.5 transition-colors"
            style={{
              color: activeTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)",
              borderBottom: activeTab === tab ? "1px solid var(--on-surface)" : "1px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Order Book" && ob ? (
        <>
          {/* Column headers */}
          <div className="flex items-center px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
            <div className="w-4 shrink-0" />
            <Filter size={9} className="mr-1 shrink-0" />
            <span className="w-20">TRADE YES</span>
            <span className="flex-1 text-right">PRICE</span>
            <span className="flex-1 text-right">SHARES</span>
            <span className="flex-1 text-right">TOTAL</span>
          </div>

          {/* Asks */}
          {ob.asks.map((level: OrderBookLevel, i: number) => (
            <PriceLevelRow key={`ask-${i}`} level={level} side="ask" maxShares={maxShares} onPriceClick={onPriceClick} />
          ))}

          {/* Last / Spread */}
          <div className="flex items-center justify-between px-4 py-1.5" style={{ borderTop: "1px solid rgba(66,70,84,0.3)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
            <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Last: <span style={{ color: "var(--on-surface)" }}>{ob.lastPrice.toFixed(1)}&cent;</span>
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Spread: <span style={{ color: "var(--on-surface)" }}>{ob.spread.toFixed(1)}&cent;</span>
            </span>
          </div>

          {/* Bids */}
          {ob.bids.map((level: OrderBookLevel, i: number) => (
            <PriceLevelRow key={`bid-${i}`} level={level} side="bid" maxShares={maxShares} onPriceClick={onPriceClick} />
          ))}
        </>
      ) : activeTab === "Resolution" ? (
        <p className="px-4 py-3 text-[11px] font-mono leading-relaxed" style={{ color: "var(--on-surface-muted)" }}>
          {market.resolutionCriteria || "This market resolves based on the official price at expiry."}
        </p>
      ) : (
        <p className="px-4 py-3 text-[11px] font-mono text-center" style={{ color: "var(--on-surface-disabled)" }}>Graph view coming soon</p>
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
  const [orderBookData, setOrderBookData] = useState(market.orderBookData);

  // Use real-time order book updates if market has CLOB token IDs
  const { orderBook: realtimeOrderBook, isConnected } = usePolymarketOrderBook(market.clobTokenIds || "");

  // Update order book data when real-time data changes
  useEffect(() => {
    if (realtimeOrderBook) {
      // Transform CLOB order book format to OrderBookData format
      const transformedOrderBook = {
        asks: (realtimeOrderBook.asks || []).slice(0, 5).map((ask: any) => ({
          price: ask.price,
          shares: parseFloat(ask.volume) || 0,
          total: (ask.price * (parseFloat(ask.volume) || 0)) / 100,
          orders: [
            {
              id: `ask-${ask.price}`,
              price: ask.price,
              shares: parseFloat(ask.volume) || 0,
              maker: "Market",
              timestamp: "now",
            },
          ],
        })),
        bids: (realtimeOrderBook.bids || []).slice(0, 5).map((bid: any) => ({
          price: bid.price,
          shares: parseFloat(bid.volume) || 0,
          total: (bid.price * (parseFloat(bid.volume) || 0)) / 100,
          orders: [
            {
              id: `bid-${bid.price}`,
              price: bid.price,
              shares: parseFloat(bid.volume) || 0,
              maker: "Market",
              timestamp: "now",
            },
          ],
        })),
        lastPrice: realtimeOrderBook.lastPrice || market.currentPrice || 0.5,
        spread: realtimeOrderBook.spread || 0,
      };
      setOrderBookData(transformedOrderBook);
    }
  }, [realtimeOrderBook, market.currentPrice, market.clobTokenIds]);

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
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium font-mono" style={{ color: "var(--on-surface)" }}>Order Book</span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        </div>
        <span className="text-[11px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>{formattedVolume}</span>
      </div>

      {/* Options list */}
      {isHitPrice ? (
        <div className="overflow-y-auto scrollbar-hide">
          {market.options.map((option, i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(66,70,84,0.3)" }} className="last:border-b-0">
              {/* Option row */}
              <div
                onClick={() => setExpandedOption(expandedOption === i ? null : i)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                {/* Arrow toggle */}
                <span className="shrink-0" style={{ color: "var(--on-surface-disabled)" }}>
                  {expandedOption === i
                    ? <ChevronDown size={13} />
                    : <ChevronRight size={13} />}
                </span>

                {/* Label + volume */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span
                    className="text-[13px] font-mono font-medium leading-none"
                    style={{ color: option.direction === "up" ? "var(--buy)" : "var(--sell)" }}
                  >
                    {option.label}
                  </span>
                  {option.volume && (
                    <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>{option.volume}</span>
                  )}
                </div>

                {/* Percentage */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[13px] font-mono font-semibold" style={{ color: "var(--on-surface)" }}>
                    {option.percentage < 1 ? "<1%" : `${option.percentage}%`}
                  </span>
                  {option.percentage > 1 && (
                    <span className="text-[10px] font-mono" style={{ color: "var(--sell)" }}>
                      ▼{(option.percentage * 0.3).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Buy Yes / Buy No buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleOptionBuy(e, i, "buy", option.yesPrice)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded transition-colors whitespace-nowrap"
                    style={{ background: "rgba(0,192,118,0.12)", color: "var(--buy)", border: "1px solid rgba(0,192,118,0.25)" }}
                  >
                    Buy Yes {option.yesPrice !== undefined ? `${option.yesPrice}¢` : "0.2¢"}
                  </button>
                  <button
                    onClick={(e) => handleOptionBuy(e, i, "sell", option.noPrice)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded transition-colors whitespace-nowrap"
                    style={{ background: "rgba(255,77,79,0.12)", color: "var(--sell)", border: "1px solid rgba(255,77,79,0.25)" }}
                  >
                    Buy No {option.noPrice !== undefined ? `${option.noPrice}¢` : "99.9¢"}
                  </button>
                </div>
              </div>

              {/* Inline order book (expanded) */}
              {expandedOption === i && (
                <InlineOrderBook market={market} orderBookData={orderBookData} onPriceClick={handlePriceClick} />
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
                  className="w-2 h-2 rounded-full"
                  style={{ background: option.direction === "up" ? "var(--buy)" : "var(--sell)" }}
                />
                <span className="text-[13px] font-mono font-medium" style={{ color: "var(--on-surface)" }}>{option.label}</span>
              </div>
              <span className="text-[13px] font-mono font-semibold" style={{ color: "var(--on-surface)" }}>{option.percentage}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Rules / Market Context */}
      <div style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
        <div className="flex items-center gap-4 px-4 py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
          {infoTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveInfoTab(tab)}
              className="text-[12px] font-mono transition-colors pb-1"
              style={{
                color: activeInfoTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)",
                borderBottom: activeInfoTab === tab ? "1px solid var(--on-surface)" : "1px solid transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 text-[11px] font-mono leading-relaxed" style={{ color: "var(--on-surface-muted)" }}>
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

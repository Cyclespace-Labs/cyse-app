"use client";

import { useMemo } from "react";
import { OrderBookEntry } from "@/types/trading";
import { getTickSize } from "@/lib/tradingData";

function seededRng(seed: number) {
  let s = ((seed * 1664525 + 1013904223) >>> 0);
  return () => {
    s = ((s * 1664525 + 1013904223) >>> 0);
    return s / 0xffffffff;
  };
}

export interface SimulatedBook {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  bestAsk: number;
  bestBid: number;
  spread: number;
  bidPct: number;
  askPct: number;
}

export function useSimulatedOrderBook(currentPrice: number, levels = 14): SimulatedBook {
  return useMemo(() => {
    if (!currentPrice || currentPrice <= 0) {
      return { asks: [], bids: [], bestAsk: 0, bestBid: 0, spread: 0, bidPct: 50, askPct: 50 };
    }

    const tickSize = getTickSize(currentPrice);
    const decimals = Math.max(2, -Math.floor(Math.log10(tickSize)));

    const bestAsk = parseFloat((currentPrice + tickSize).toFixed(decimals));
    const bestBid = parseFloat((currentPrice - tickSize).toFixed(decimals));
    const spread = parseFloat((bestAsk - bestBid).toFixed(decimals));

    // Stable seed: rounds to nearest tick level so minor drift doesn't re-randomise the book
    const seed = Math.round(currentPrice / tickSize);
    const rng = seededRng(seed);

    // Asks: generate lowest → highest, then cumulate from the top
    const askLevels: Array<{ price: number; size: number }> = Array.from({ length: levels }, (_, i) => ({
      price: parseFloat((bestAsk + i * tickSize).toFixed(decimals)),
      size: parseFloat((rng() * 3200 + 150).toFixed(2)),
    }));

    let runningAsk = 0;
    // Display: highest price at top, lowest at bottom → reversed with cumulative from top
    const asks: OrderBookEntry[] = askLevels.slice().reverse().map((o) => {
      runningAsk += o.size;
      return { price: o.price, size: o.size, total: parseFloat(runningAsk.toFixed(2)) };
    });

    // Bids: generate highest → lowest
    const bids: OrderBookEntry[] = [];
    let runningBid = 0;
    for (let i = 0; i < levels; i++) {
      const price = parseFloat((bestBid - i * tickSize).toFixed(decimals));
      const size = parseFloat((rng() * 3200 + 150).toFixed(2));
      runningBid += size;
      bids.push({ price, size, total: parseFloat(runningBid.toFixed(2)) });
    }

    const totalAll = runningAsk + runningBid;
    const bidPct = totalAll > 0 ? Math.round((runningBid / totalAll) * 100) : 50;

    return { asks, bids, bestAsk, bestBid, spread, bidPct, askPct: 100 - bidPct };
  }, [currentPrice, levels]);
}

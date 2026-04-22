"use client";

/**
 * Real-time Pyth price streaming via Hermes SSE.
 *
 * Connects to: GET https://hermes.pyth.network/v2/updates/price/stream?ids[]=<feedId>&...
 * Receives ~1 event/second per feed with parsed price data.
 *
 * Docs: https://docs.pyth.network/price-feeds/core/fetch-price-updates#streaming
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { HERMES_BASE_URL, PYTH_FEED_IDS, feedIdToPair } from "@/lib/pyth/config";
import type { PythParsedFeed, PythResolvedPrice, PythStreamEvent } from "@/types/trading";

const MAX_RECONNECTS   = 10;
const RECONNECT_BASE   = 1_000; // 1 s initial backoff
const RECONNECT_MAX    = 30_000; // 30 s max

/** Convert raw Pyth price fields to a human-readable number. */
function parsePythPrice(raw: { price: string; conf: string; expo: number }): { price: number; confidence: number } {
  const p = Number(raw.price);
  const c = Number(raw.conf);
  const factor = Math.pow(10, raw.expo);
  return { price: p * factor, confidence: c * factor };
}

/** Resolve a PythParsedFeed into a PythResolvedPrice. */
function resolvePrice(feed: PythParsedFeed, updateHex: string | null): PythResolvedPrice {
  const id = feed.id.startsWith("0x") ? feed.id : `0x${feed.id}`;
  const { price, confidence } = parsePythPrice(feed.price);
  const { price: emaPrice } = parsePythPrice(feed.ema_price);
  const pair = feedIdToPair(id) ?? id.slice(0, 10);

  return {
    pair,
    feedId: id,
    price,
    confidence,
    emaPrice,
    publishTime: feed.price.publish_time,
    priceRaw: feed.price.price,
    exponent: feed.price.expo,
    updateData: updateHex,
  };
}

export interface UsePythPricesReturn {
  /** Map of "ETH/USD" → PythResolvedPrice */
  prices: Record<string, PythResolvedPrice>;
  /** Whether the SSE connection is currently open. */
  connected: boolean;
  /** Number of reconnection attempts so far. */
  reconnects: number;
  /** Last error message, if any. */
  error: string | null;
  /** Timestamp of the latest received event. */
  lastUpdate: number;
}

/**
 * Stream real-time prices from Pyth Hermes SSE.
 *
 * @param feedIds - Array of 0x-prefixed feed IDs to subscribe to.
 *                  Defaults to all feeds in PYTH_FEED_IDS.
 */
export function usePythPrices(feedIds?: string[]): UsePythPricesReturn {
  const ids = feedIds ?? Object.values(PYTH_FEED_IDS);

  const [prices, setPrices]           = useState<Record<string, PythResolvedPrice>>({});
  const [connected, setConnected]     = useState(false);
  const [reconnects, setReconnects]   = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdate, setLastUpdate]   = useState(0);

  const esRef        = useRef<EventSource | null>(null);
  const reconnectRef = useRef(0);
  const mountedRef   = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Build SSE URL: /v2/updates/price/stream?ids[]=<id1>&ids[]=<id2>&parsed=true
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("ids[]", id));
    params.set("parsed", "true");
    params.set("allow_unordered", "true");
    params.set("benchmarks_only", "false");

    const url = `${HERMES_BASE_URL}/v2/updates/price/stream?${params.toString()}`;
    console.log("[usePythPrices] connecting to SSE:", url);

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      console.log("[usePythPrices] SSE connected");
      setConnected(true);
      setError(null);
      reconnectRef.current = 0;
      setReconnects(0);
    };

    es.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data: PythStreamEvent = JSON.parse(event.data);
        if (!data.parsed?.length) return;

        // First hex VAA (for on-chain submission if needed)
        const updateHex = data.binary?.data?.[0] ?? null;

        setPrices((prev) => {
          const next = { ...prev };
          for (const feed of data.parsed) {
            const resolved = resolvePrice(feed, updateHex);
            next[resolved.pair] = resolved;
          }
          return next;
        });
        setLastUpdate(Date.now());
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      es.close();

      if (reconnectRef.current < MAX_RECONNECTS) {
        reconnectRef.current++;
        setReconnects(reconnectRef.current);
        const delay = Math.min(RECONNECT_BASE * Math.pow(2, reconnectRef.current - 1), RECONNECT_MAX);
        console.log(`[usePythPrices] reconnecting in ${delay}ms (attempt ${reconnectRef.current})`);
        setTimeout(connect, delay);
      } else {
        setError(`Failed after ${MAX_RECONNECTS} reconnection attempts`);
        console.error("[usePythPrices] max reconnects reached");
      }
    };
  }, [ids]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return { prices, connected, reconnects, error, lastUpdate };
}

/**
 * Convenience hook: get a single Pyth feed price by pair name ("ETH/USD").
 */
export function usePythPrice(pair: string, allPrices: Record<string, PythResolvedPrice>): PythResolvedPrice | null {
  return allPrices[pair] ?? null;
}

export default usePythPrices;

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface Candle {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseCandleDataReturn {
  candles: Candle[];
  loading: boolean;
  error: string | null;
}

// Interval → seconds per bar (for live candle bucketing)
const INTERVAL_SECONDS: Record<string, number> = {
  "1m":  60,
  "3m":  180,
  "5m":  300,
  "15m": 900,
  "30m": 1800,
  "1h":  3600,
  "4h":  14400,
  "1d":  86400,
};

// Dynamic candle count per interval — matches API defaults for full chart history
const DEFAULT_LIMITS: Record<string, number> = {
  "1m": 1000, "3m": 1000, "5m": 1000, "15m": 750, "30m": 750,
  "1h": 750, "4h": 500, "1d": 500,
};

/**
 * Fetches real historical candle data from Binance via our API route,
 * and keeps the latest candle updated with the live price from Pyth SSE.
 */
export function useCandleData(
  symbol: string,
  interval: string,
  livePrice?: number,
): UseCandleDataReturn {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barSecsRef = useRef(INTERVAL_SECONDS[interval] ?? 60);
  const fetchIdRef = useRef(0);       // guard against stale fetches
  const readyRef = useRef(false);     // true once initial fetch completes

  // Keep bar seconds in sync
  barSecsRef.current = INTERVAL_SECONDS[interval] ?? 60;

  // ── Fetch historical candles ──────────────────────────────────────────────
  const fetchCandles = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    readyRef.current = false;
    setCandles([]); // Clear old data when fetching new
    try {
      const candleLimit = DEFAULT_LIMITS[interval] ?? 500;
      const res = await fetch(
        `/api/trading/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${candleLimit}`
      );
      if (id !== fetchIdRef.current) return; // stale
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (id !== fetchIdRef.current) return; // stale
      const fetched: Candle[] = data.candles ?? [];
      setCandles(fetched);
      readyRef.current = true;
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      console.error("[useCandleData] fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [symbol, interval]);

  // Fetch on mount and when symbol/interval change
  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  // Auto-refresh every 60s to pick up new closed candles
  useEffect(() => {
    const id = setInterval(fetchCandles, 60_000);
    return () => clearInterval(id);
  }, [fetchCandles]);

  // ── Live price → update/create the latest candle ──────────────────────────
  useEffect(() => {
    if (!livePrice || livePrice <= 0 || !readyRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    const barSecs = barSecsRef.current;
    const barStart = Math.floor(now / barSecs) * barSecs;

    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];

      if (last.time === barStart) {
        // Same bar — update in place
        const updated = {
          ...last,
          high: Math.max(last.high, livePrice),
          low: Math.min(last.low, livePrice),
          close: livePrice,
        };
        // Only create new array if values actually changed
        if (updated.high === last.high && updated.low === last.low && updated.close === last.close) return prev;
        const next = prev.slice();
        next[next.length - 1] = updated;
        return next;
      }

      if (barStart > last.time) {
        // New bar
        return [...prev, {
          time: barStart,
          open: livePrice,
          high: livePrice,
          low: livePrice,
          close: livePrice,
          volume: 0,
        }];
      }

      // Bar time is before current bar — update close
      const updated = {
        ...last,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
        close: livePrice,
      };
      if (updated.high === last.high && updated.low === last.low && updated.close === last.close) return prev;
      const next = prev.slice();
      next[next.length - 1] = updated;
      return next;
    });
  }, [livePrice, interval]);

  return { candles, loading, error };
}

"use client";

import { useCallback, useMemo } from "react";
import { useAccount } from "wagmi";

// v2 prefix invalidates any old cached data with the broken format
const CACHE_KEY_PREFIX = "cyse_tx_v2_";
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CachedEntry {
  id: string;
  type: "order" | "position" | "fill" | "funding" | "swap";
  data: unknown;
  timestamp: number; // actual block timestamp in ms
  blockNumber: number;
  txHash: string;
}

interface CacheStore {
  entries: CachedEntry[];
  highWaterBlock: number;
  savedAt: number;
}

const EMPTY: CacheStore = { entries: [], highWaterBlock: 0, savedAt: 0 };

/**
 * Lightweight transaction cache using localStorage directly.
 *
 * Design: all reads/writes go straight to localStorage via stable callbacks —
 * no React state for data. This completely eliminates stale-closure bugs that
 * occurred when addTransaction captured an outdated `cache` state snapshot.
 */
export function useTransactionCache() {
  const { address } = useAccount();

  const cacheKey = useMemo(
    () => `${CACHE_KEY_PREFIX}${address?.toLowerCase() ?? "anon"}`,
    [address]
  );

  // Always reads the latest value straight from localStorage
  const read = useCallback((): CacheStore => {
    if (typeof window === "undefined" || !address) return EMPTY;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return EMPTY;
      const parsed: CacheStore = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > CACHE_EXPIRY_MS) {
        localStorage.removeItem(cacheKey);
        return EMPTY;
      }
      return parsed;
    } catch {
      return EMPTY;
    }
  }, [cacheKey, address]);

  const write = useCallback(
    (store: CacheStore) => {
      if (typeof window === "undefined" || !address) return;
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ...store, savedAt: Date.now() }));
      } catch {}
    },
    [cacheKey, address]
  );

  /** Highest block number we have locally cached */
  const getHighWaterBlock = useCallback((): number => read().highWaterBlock, [read]);

  /**
   * Merge freshly-fetched items with the local cache.
   * De-duplication is by id. New items are batch-saved in one write
   * (no looping addTransaction — that was the stale-closure bug).
   * Returns the full sorted list (newest block first).
   */
  const mergeWithCache = useCallback(
    <T>(
      type: CachedEntry["type"],
      freshItems: T[],
      getId: (item: T) => string,
      getBlock: (item: T) => number,
      getTimestamp: (item: T) => number
    ): T[] => {
      const store = read();
      const cached = store.entries.filter((e) => e.type === type).map((e) => e.data as T);
      const cachedIds = new Set(cached.map(getId));

      const newItems = freshItems.filter((item) => !cachedIds.has(getId(item)));

      if (newItems.length > 0) {
        const newEntries: CachedEntry[] = newItems.map((item) => ({
          id: getId(item),
          type,
          data: item,
          timestamp: getTimestamp(item),
          blockNumber: getBlock(item),
          txHash: (item as { txHash?: string }).txHash ?? "",
        }));

        const highWaterBlock = Math.max(store.highWaterBlock, ...newItems.map(getBlock));

        write({
          entries: [...newEntries, ...store.entries].slice(0, 2000),
          highWaterBlock,
          savedAt: Date.now(),
        });
      }

      return [...newItems, ...cached].sort((a, b) => getBlock(b) - getBlock(a));
    },
    [read, write]
  );

  const clearCache = useCallback(() => {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(cacheKey); } catch {}
  }, [cacheKey]);

  return {
    mergeWithCache,
    getHighWaterBlock,
    clearCache,
    isReady: !!address,
  };
}

export type { CacheStore };

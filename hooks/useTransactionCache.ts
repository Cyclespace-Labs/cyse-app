"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

const CACHE_KEY_PREFIX = "cyse_tx_cache_";
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CachedTransaction {
  id: string;
  type: "order" | "position" | "fill" | "funding";
  data: unknown;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

interface CacheData {
  transactions: CachedTransaction[];
  lastUpdated: number;
  blockHeight: number;
}

export function useTransactionCache() {
  const { address } = useAccount();
  const [cache, setCache] = useState<CacheData | null>(null);

  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY_PREFIX}${address?.toLowerCase() || "anonymous"}`;
  }, [address]);

  // Load cache from localStorage on mount
  useEffect(() => {
    if (!address) return;
    
    try {
      const key = getCacheKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: CacheData = JSON.parse(stored);
        // Check if cache is expired
        if (Date.now() - parsed.lastUpdated < CACHE_EXPIRY) {
          setCache(parsed);
        } else {
          // Clear expired cache
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error("[useTransactionCache] Failed to load cache:", error);
    }
  }, [address, getCacheKey]);

  // Save cache to localStorage
  const saveCache = useCallback((newCache: CacheData) => {
    if (!address) return;
    
    try {
      const key = getCacheKey();
      localStorage.setItem(key, JSON.stringify(newCache));
      setCache(newCache);
    } catch (error) {
      console.error("[useTransactionCache] Failed to save cache:", error);
    }
  }, [address, getCacheKey]);

  // Add a transaction to cache
  const addTransaction = useCallback((tx: CachedTransaction) => {
    const currentCache = cache || { transactions: [], lastUpdated: Date.now(), blockHeight: 0 };
    
    // Check if transaction already exists
    const exists = currentCache.transactions.some((t) => t.txHash === tx.txHash && t.id === tx.id);
    if (exists) return;

    const newCache: CacheData = {
      transactions: [tx, ...currentCache.transactions].slice(0, 500), // Keep last 500
      lastUpdated: Date.now(),
      blockHeight: Math.max(currentCache.blockHeight, tx.blockNumber),
    };

    saveCache(newCache);
  }, [cache, saveCache]);

  // Get transactions by type
  const getTransactionsByType = useCallback(<T>(type: CachedTransaction["type"]): T[] => {
    if (!cache) return [];
    return cache.transactions
      .filter((t) => t.type === type)
      .map((t) => t.data as T);
  }, [cache]);

  // Get last synced block
  const getLastSyncedBlock = useCallback((): number => {
    return cache?.blockHeight || 0;
  }, [cache]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (!address) return;
    const key = getCacheKey();
    localStorage.removeItem(key);
    setCache(null);
  }, [address, getCacheKey]);

  // Merge fetched data with cache
  const mergeWithCache = useCallback(<T>(
    type: CachedTransaction["type"],
    newData: T[],
    getKey: (item: T) => string,
    getBlockNumber: (item: T) => number
  ): T[] => {
    const cached = getTransactionsByType<T>(type);
    const cachedKeys = new Set(cached.map(getKey));
    
    // Filter out duplicates
    const uniqueNew = newData.filter((item) => !cachedKeys.has(getKey(item)));
    
    // Add new items to cache
    uniqueNew.forEach((item) => {
      addTransaction({
        id: getKey(item),
        type,
        data: item,
        timestamp: Date.now(),
        blockNumber: getBlockNumber(item),
        txHash: (item as { txHash: string }).txHash || "",
      });
    });

    return [...uniqueNew, ...cached].sort((a, b) => {
      const blockA = getBlockNumber(a);
      const blockB = getBlockNumber(b);
      return blockB - blockA; // Descending order
    });
  }, [addTransaction, getTransactionsByType]);

  return {
    cache,
    addTransaction,
    getTransactionsByType,
    getLastSyncedBlock,
    clearCache,
    mergeWithCache,
    isReady: !!address,
  };
}

export type { CachedTransaction, CacheData };
export { CACHE_KEY_PREFIX, CACHE_EXPIRY };

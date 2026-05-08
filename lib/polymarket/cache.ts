// Simple in-memory caching layer for Polymarket API responses
// Reduces rate limiting and improves performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in seconds
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // Age in seconds

    if (age > entry.ttl) {
      // Cache expired
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clear all entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Singleton instance
const cache = new Cache();

/**
 * Generate a cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

/**
 * Get cached data with automatic key generation
 */
export function getCached<T>(prefix: string, params: Record<string, any>): T | null {
  const key = generateCacheKey(prefix, params);
  return cache.get<T>(key);
}

/**
 * Set cached data with automatic key generation
 */
export function setCached<T>(prefix: string, params: Record<string, any>, data: T, ttl: number): void {
  const key = generateCacheKey(prefix, params);
  cache.set(key, data, ttl);
}

/**
 * Invalidate cache for a specific prefix
 */
export function invalidateCache(prefix: string): void {
  cache.clearPattern(`^${prefix}:`);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get cache instance (for advanced usage)
 */
export function getCacheInstance(): Cache {
  return cache;
}

// Export singleton for direct access if needed
export default cache;

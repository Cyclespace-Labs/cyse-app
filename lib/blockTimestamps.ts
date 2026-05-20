/**
 * Module-level block-timestamp cache shared across all hooks.
 * Fetches and memoises block timestamps so repeated getLogs calls
 * for the same blocks don't hit the RPC multiple times.
 */

import type { PublicClient } from "viem";

const _cache = new Map<number, number>(); // blockNumber → epoch ms

/**
 * Given a list of block numbers, returns a map of blockNumber → timestamp (ms).
 * Already-cached blocks are served from memory; missing ones are batch-fetched.
 */
export async function resolveBlockTimestamps(
  client: PublicClient,
  blockNumbers: number[]
): Promise<Map<number, number>> {
  const missing = [...new Set(blockNumbers)].filter((b) => !_cache.has(b));

  if (missing.length > 0) {
    await Promise.allSettled(
      missing.map((bn) =>
        client
          .getBlock({ blockNumber: BigInt(bn) })
          .then((block) => { _cache.set(bn, Number(block.timestamp) * 1000); })
          .catch(() => { _cache.set(bn, Date.now()); })
      )
    );
  }

  return _cache;
}

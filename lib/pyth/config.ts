/**
 * Pyth Network configuration — price feed IDs, Hermes endpoints, and
 * token-address → feed-ID mapping.
 *
 * Feed ID directory: https://pyth.network/developers/price-feed-ids
 * Hermes API:        https://hermes.pyth.network
 */

// ── Hermes endpoints (HTTP + WebSocket, real-time streaming) ────────────────
export const HERMES_BASE_URL =
  process.env.NEXT_PUBLIC_PYTH_HERMES_URL ?? "https://hermes.pyth.network";

export const HERMES_WS_URL =
  process.env.NEXT_PUBLIC_PYTH_HERMES_WS_URL ?? "wss://hermes.pyth.network/ws";

// ── Stable price-feed IDs ───────────────────────────────────────────────────
// Each ID is a 32-byte hex string that uniquely identifies a Pyth price feed.
export const PYTH_FEED_IDS = {
  "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  "BNB/USD": "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
  "USDC/USD": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  "USDT/USD": "0x2b89b9dc8fdf9f34592c9112e79f97a7f5bbed7d21c4cd47f2c46fb7a4d30da0",
} as const;

export type PythFeedPair = keyof typeof PYTH_FEED_IDS;

// ── Token symbol / address → Pyth feed mapping ─────────────────────────────
// Lowercase address → Pyth feed pair
const ADDRESS_TO_FEED: Record<string, PythFeedPair> = {};

// Populated at import time from the protocol's address book
export function registerTokenAddress(address: string, pair: PythFeedPair) {
  ADDRESS_TO_FEED[address.toLowerCase()] = pair;
}

// Symbol shorthand
const SYMBOL_TO_FEED: Record<string, PythFeedPair> = {
  ETH: "ETH/USD",
  WETH: "ETH/USD",
  BTC: "BTC/USD",
  WBTC: "BTC/USD",
  BNB: "BNB/USD",
  USDC: "USDC/USD",
  USDT: "USDT/USD",
};

/** Resolve a token address or symbol to a Pyth price-feed pair string. */
export function resolvePythFeed(tokenOrSymbol: string): PythFeedPair | null {
  // Try as symbol first
  const sym = SYMBOL_TO_FEED[tokenOrSymbol.toUpperCase()];
  if (sym) return sym;
  // Try as address
  return ADDRESS_TO_FEED[tokenOrSymbol.toLowerCase()] ?? null;
}

/** Get the Pyth feed ID hex for a token address or symbol. */
export function getPythFeedId(tokenOrSymbol: string): string | null {
  const pair = resolvePythFeed(tokenOrSymbol);
  return pair ? PYTH_FEED_IDS[pair] : null;
}

/** All active feed IDs as an array (for batch requests). */
export function getAllFeedIds(): string[] {
  return Object.values(PYTH_FEED_IDS);
}

/** Reverse lookup: feed ID → pair name. */
const FEED_ID_TO_PAIR: Record<string, PythFeedPair> = {};
for (const [pair, id] of Object.entries(PYTH_FEED_IDS)) {
  FEED_ID_TO_PAIR[id] = pair as PythFeedPair;
}
export function feedIdToPair(feedId: string): PythFeedPair | null {
  // Normalize: strip leading 0x if present, lowercase
  const key = feedId.startsWith("0x") ? feedId : `0x${feedId}`;
  return FEED_ID_TO_PAIR[key.toLowerCase()] ?? FEED_ID_TO_PAIR[key] ?? null;
}

// ── TradingView symbol mapping (PYTH: prefix) ──────────────────────────────
export const TV_PYTH_SYMBOLS: Record<string, string> = {
  ETH: "PYTH:ETHUSD",
  BTC: "PYTH:BTCUSD",
  BNB: "PYTH:BNBUSD",
  USDC: "PYTH:USDCUSD",
};

// ── Pyth Benchmarks URL for TradingView UDF datafeed ────────────────────────
export const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network";

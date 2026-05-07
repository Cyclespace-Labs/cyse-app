export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface TickerItem {
  symbol: string;
  price: string;
  change: number;
}

export interface TradeEntry {
  price: number;
  size: number;
  time: string;
  side: "buy" | "sell";
}

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: "limit" | "market" | "conditional";
  price: number;
  quantity: number;
  filled: number;
  status: "pending" | "open" | "filled" | "cancelled";
  createdAt: number;
  tp?: number;
  sl?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  quantity: number;
  leverage: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  margin: number;
  createdAt: number;
}

// Order history entry
export interface OrderHistoryEntry {
  id: string;
  orderIndex: number;
  symbol: string;
  side: "buy" | "sell";
  type: "limit" | "market" | "conditional";
  triggerPrice: number;
  sizeDelta: number;
  collateralToken: string;
  isLong: boolean;
  status: "created" | "cancelled" | "executed";
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

// Position history entry
export interface PositionHistoryEntry {
  id: string;
  symbol: string;
  side: "long" | "short";
  action: "increase" | "decrease" | "close" | "liquidated";
  entryPrice: number;
  exitPrice?: number;
  sizeDelta: number;
  collateralDelta: number;
  pnl?: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

// Fill history entry
export interface FillHistoryEntry {
  id: string;
  orderIndex: number;
  symbol: string;
  side: "buy" | "sell";
  type: "limit" | "market" | "conditional";
  executionPrice: number;
  sizeDelta: number;
  collateralDelta: number;
  fee: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

// Funding history entry
export interface FundingHistoryEntry {
  id: string;
  symbol: string;
  side: "long" | "short";
  fundingRate: number;
  fundingFee: number;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface TradingUser {
  isAuthenticated: boolean;
  username: string;
  balance: number;
  equity: number;
}

export interface TokenPriceData {
  symbol: string;
  pair: string;
  leverage: string;
  price: number;
  openPrice: number;
  indexPrice: number;
  change24h: number;
  changePct24h: number;
  funding: string;
  countdown: string;
  high24h: number;
  low24h: number;
  volume24h: number;
  openInterest: number;
  profitApy: string;
}

// ── Pyth Network price types ────────────────────────────────────────────────

/** Single Pyth price point (matches Hermes parsed response). */
export interface PythPrice {
  price: string;      // int price as string, e.g. "6163260000000"
  conf: string;       // confidence interval as string
  expo: number;       // exponent, e.g. -8
  publish_time: number; // unix timestamp
}

/** Parsed price update from Hermes SSE stream. */
export interface PythParsedFeed {
  id: string;         // 32-byte hex feed ID (no 0x prefix in SSE)
  price: PythPrice;
  ema_price: PythPrice;
}

/** Full SSE event payload from Hermes /v2/updates/price/stream. */
export interface PythStreamEvent {
  binary: {
    encoding: string;
    data: string[];   // hex-encoded update bytes (for on-chain submission)
  };
  parsed: PythParsedFeed[];
}

/** Resolved real-time price from a Pyth feed. */
export interface PythResolvedPrice {
  pair: string;       // e.g. "ETH/USD"
  feedId: string;     // 0x-prefixed hex
  price: number;      // USD price (human-readable)
  confidence: number; // ± USD confidence
  emaPrice: number;   // exponential moving average price
  publishTime: number; // unix timestamp
  // Raw values for on-chain submission
  priceRaw: string;
  exponent: number;
  updateData: string | null; // hex VAA for on-chain updatePriceFeeds()
}

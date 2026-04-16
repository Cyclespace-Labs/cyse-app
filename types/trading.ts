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

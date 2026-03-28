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

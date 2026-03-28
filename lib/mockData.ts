import { OrderBookEntry, TickerItem, CandlestickData } from "@/types/trading";

export const askOrders: OrderBookEntry[] = [
  { price: 86.22, size: 63.85, total: 17541.01 },
  { price: 86.21, size: 2755.10, total: 17477.16 },
  { price: 86.20, size: 2901.14, total: 14722.06 },
  { price: 86.19, size: 2622.33, total: 12520.92 },
  { price: 86.18, size: 2394.51, total: 9898.59 },
  { price: 86.17, size: 3326.55, total: 7504.08 },
  { price: 86.16, size: 3545.07, total: 4177.53 },
  { price: 86.15, size: 1480.97, total: 1632.46 },
  { price: 86.14, size: 151.49, total: 151.49 },
];

export const bidOrders: OrderBookEntry[] = [
  { price: 86.13, size: 1896.92, total: 1896.92 },
  { price: 86.12, size: 2392.27, total: 4289.19 },
  { price: 86.11, size: 2860.69, total: 7149.88 },
  { price: 86.10, size: 2246.72, total: 9396.60 },
  { price: 86.09, size: 2871.54, total: 12268.14 },
  { price: 86.08, size: 2143.66, total: 14411.80 },
  { price: 86.07, size: 2204.96, total: 16616.76 },
  { price: 86.06, size: 2598.81, total: 19217.57 },
  { price: 86.05, size: 2626.61, total: 21844.18 },
  { price: 86.04, size: 2024.55, total: 23868.73 },
];

export const tickerItems: TickerItem[] = [
  { symbol: "XPL-PERP", price: "$0.09932", change: -6.01 },
  { symbol: "OP", price: "$0.001761", change: -5.37 },
  { symbol: "LNELA-PERP", price: "$0.00820", change: -4.52 },
  { symbol: "KSONK-PERP", price: "$0.005908", change: 2.46 },
  { symbol: "DOGE-PERP", price: "$0.09186", change: -2.50 },
  { symbol: "PENGU-PERP", price: "$0.006831", change: -4.35 },
  { symbol: "KSHIB-PERP", price: "$0.005912", change: -0.94 },
  { symbol: "WLI-PERP", price: "$0.0", change: 0.0 },
  { symbol: "SOL-PERP", price: "$86.13", change: -5.18 },
  { symbol: "BTC-PERP", price: "$84,230", change: -2.14 },
  { symbol: "ETH-PERP", price: "$1,891", change: -3.42 },
  { symbol: "ARB-PERP", price: "$0.3521", change: 1.22 },
];

function generateCandlestickData(): CandlestickData[] {
  const data: CandlestickData[] = [];
  let basePrice = 85.0;
  const startTime = new Date("2025-03-28T04:00:00");

  for (let i = 0; i < 200; i++) {
    const time = new Date(startTime.getTime() + i * 60000);
    const volatility = 0.3;
    const change = (Math.random() - 0.48) * volatility;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 0.15;
    const low = Math.min(open, close) - Math.random() * 0.15;
    const volume = Math.floor(Math.random() * 12000) + 2000;

    data.push({
      time: time.toISOString().slice(0, 19).replace("T", " "),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    basePrice = close;
    if (basePrice < 83) basePrice = 83.5;
    if (basePrice > 88) basePrice = 87.5;
  }

  return data;
}

export const candlestickData = generateCandlestickData();

export const priceHeaderData = {
  symbol: "SOL-PERP",
  leverage: "50x",
  price: 86.13,
  indexPrice: 86.17,
  change24h: -4.63,
  changePct24h: -5.18,
  funding: "0.0016%",
  countdown: "00:03:24",
  high24h: 90.77,
  low24h: 85.40,
  volume24h: 58583987.60,
  openInterest: 368351.74,
  profitApy: "3.08%",
};

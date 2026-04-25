import { CandlestickData, TokenPriceData } from "@/types/trading";

// Seeded PRNG for deterministic data generation (avoids hydration mismatch)
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface TokenConfig {
  symbol: string;
  pair: string;
  leverage: string;
  basePrice: number;
  volatility: number;
  minPrice: number;
  maxPrice: number;
  volume24h: number;
  openInterest: number;
  fundingRate: string;
  profitApy: string;
}

const tokenConfigs: Record<string, TokenConfig> = {
  SOL: {
    symbol: "SOL",
    pair: "SOL/USD",
    leverage: "50x",
    basePrice: 86.0,
    volatility: 0.3,
    minPrice: 83,
    maxPrice: 88,
    volume24h: 58583987.6,
    openInterest: 368351.74,
    fundingRate: "0.0016%",
    profitApy: "3.08%",
  },
  BTC: {
    symbol: "BTC",
    pair: "BTC/USD",
    leverage: "10x",
    basePrice: 84230,
    volatility: 150,
    minPrice: 82000,
    maxPrice: 86500,
    volume24h: 1250000000,
    openInterest: 42500,
    fundingRate: "0.0012%",
    profitApy: "2.45%",
  },
  ETH: {
    symbol: "ETH",
    pair: "ETH/USD",
    leverage: "20x",
    basePrice: 1891,
    volatility: 8,
    minPrice: 1820,
    maxPrice: 1960,
    volume24h: 380000000,
    openInterest: 185000,
    fundingRate: "0.0009%",
    profitApy: "1.92%",
  },
  DOGE: {
    symbol: "DOGE",
    pair: "DOGE/USD",
    leverage: "20x",
    basePrice: 0.0919,
    volatility: 0.002,
    minPrice: 0.085,
    maxPrice: 0.098,
    volume24h: 45000000,
    openInterest: 520000000,
    fundingRate: "0.0008%",
    profitApy: "1.15%",
  },
  PENGU: {
    symbol: "PENGU",
    pair: "PENGU/USD",
    leverage: "10x",
    basePrice: 0.006831,
    volatility: 0.0002,
    minPrice: 0.006,
    maxPrice: 0.0078,
    volume24h: 12000000,
    openInterest: 8500000000,
    fundingRate: "-0.0005%",
    profitApy: "0.85%",
  },
  ARB: {
    symbol: "ARB",
    pair: "ARB/USD",
    leverage: "20x",
    basePrice: 0.3521,
    volatility: 0.008,
    minPrice: 0.32,
    maxPrice: 0.39,
    volume24h: 78000000,
    openInterest: 95000000,
    fundingRate: "0.0011%",
    profitApy: "2.12%",
  },
  OP: {
    symbol: "OP",
    pair: "OP/USD",
    leverage: "20x",
    basePrice: 0.8761,
    volatility: 0.02,
    minPrice: 0.82,
    maxPrice: 0.95,
    volume24h: 52000000,
    openInterest: 35000000,
    fundingRate: "0.0007%",
    profitApy: "1.68%",
  },
  BP: {
    symbol: "BP",
    pair: "BP/USD",
    leverage: "5x",
    basePrice: 0.15991,
    volatility: 0.005,
    minPrice: 0.14,
    maxPrice: 0.18,
    volume24h: 1990000,
    openInterest: 125000000,
    fundingRate: "0.0020%",
    profitApy: "4.25%",
  },
};

const dataCache: Record<string, CandlestickData[]> = {};

function getDecimals(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 2;
  if (price >= 0.01) return 4;
  return 6;
}

export function generateCandlestickDataForToken(symbol: string): CandlestickData[] {
  if (dataCache[symbol]) return dataCache[symbol];

  const config = tokenConfigs[symbol];
  if (!config) return generateCandlestickDataForToken("SOL");

  // Use symbol hash as seed for deterministic data
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed = seed * 31 + symbol.charCodeAt(i);
  const random = createSeededRandom(Math.abs(seed) + 1);

  const data: CandlestickData[] = [];
  let basePrice = config.basePrice;
  const startTime = new Date("2025-03-28T04:00:00");
  const decimals = getDecimals(config.basePrice);

  for (let i = 0; i < 200; i++) {
    const time = new Date(startTime.getTime() + i * 60000);
    const change = (random() - 0.48) * config.volatility;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + random() * (config.volatility * 0.5);
    const low = Math.min(open, close) - random() * (config.volatility * 0.5);
    const volume = Math.floor(random() * 12000) + 2000;

    data.push({
      time: time.toISOString().slice(0, 19).replace("T", " "),
      open: parseFloat(open.toFixed(decimals)),
      high: parseFloat(high.toFixed(decimals)),
      low: parseFloat(low.toFixed(decimals)),
      close: parseFloat(close.toFixed(decimals)),
      volume,
    });

    basePrice = close;
    if (basePrice < config.minPrice) basePrice = config.minPrice + config.volatility;
    if (basePrice > config.maxPrice) basePrice = config.maxPrice - config.volatility;
  }

  dataCache[symbol] = data;
  return data;
}

export function getTokenPriceData(symbol: string): TokenPriceData {
  const config = tokenConfigs[symbol] || tokenConfigs["SOL"];
  const data = generateCandlestickDataForToken(symbol);
  const lastCandle = data[data.length - 1];
  const firstCandle = data[0];

  const currentPrice = lastCandle.close;
  const change24h = currentPrice - firstCandle.open;
  const changePct = (change24h / firstCandle.open) * 100;

  let high24h = 0;
  let low24h = Infinity;
  for (const candle of data) {
    if (candle.high > high24h) high24h = candle.high;
    if (candle.low < low24h) low24h = candle.low;
  }

  return {
    symbol: `${config.symbol}-PERP`,
    pair: config.pair,
    leverage: config.leverage,
    price: currentPrice,
    openPrice: parseFloat(firstCandle.open.toFixed(getDecimals(firstCandle.open))),
    indexPrice: parseFloat((currentPrice * 1.0004).toFixed(getDecimals(currentPrice))),
    change24h: parseFloat(change24h.toFixed(getDecimals(currentPrice))),
    changePct24h: parseFloat(changePct.toFixed(2)),
    funding: config.fundingRate,
    countdown: "00:03:24",
    high24h,
    low24h,
    volume24h: config.volume24h,
    openInterest: config.openInterest,
    profitApy: config.profitApy,
  };
}

export function getTickSize(price: number): number {
  if (price >= 1000) return 0.5;
  if (price >= 100) return 0.01;
  if (price >= 1) return 0.01;
  if (price >= 0.01) return 0.0001;
  return 0.000001;
}

/**
 * @deprecated Use oracle spread from usePriceOracle instead
 * This function is kept for chart data generation only
 */
export function getBestBidAsk(symbol: string): { bid: number; ask: number; mid: number } {
  const data = generateCandlestickDataForToken(symbol);
  const last = data[data.length - 1];
  const spread = getTickSize(last.close) * 2;
  const bid = parseFloat((last.close - spread / 2).toFixed(getDecimals(last.close)));
  const ask = parseFloat((last.close + spread / 2).toFixed(getDecimals(last.close)));
  const mid = parseFloat(((bid + ask) / 2).toFixed(getDecimals(last.close)));
  return { bid, ask, mid };
}

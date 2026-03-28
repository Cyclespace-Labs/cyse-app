import {
  PredictionMarketDetail,
  PricePoint,
  PredictionOrderBookEntry,
  Comment,
  Holder,
  MarketActivity,
} from "@/types/predictions";
import { predictionMarkets } from "./predictionsData";

function generatePriceHistory(
  baseValue: number,
  points: number,
  volatility: number
): PricePoint[] {
  const now = Math.floor(Date.now() / 1000);
  const interval = 300; // 5 min intervals
  const history: PricePoint[] = [];
  let value = baseValue;

  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.48) * volatility;
    value = Math.max(1, Math.min(99, value + change));
    history.push({
      time: now - i * interval,
      value: Math.round(value * 100) / 100,
      volume: Math.floor(Math.random() * 50000) + 5000,
    });
  }
  return history;
}

function generateOrderBook(
  currentYesPrice: number
): PredictionOrderBookEntry[] {
  const entries: PredictionOrderBookEntry[] = [];
  const yesBase = currentYesPrice;

  for (let i = 0; i < 8; i++) {
    const yesPrice = Math.max(0.1, yesBase - i * 0.5 - Math.random() * 2);
    entries.push({
      price: Math.round(yesPrice * 10) / 10,
      percentage: `${Math.round(yesPrice)}%`,
      volume: `$${(Math.random() * 50000 + 1000).toFixed(0)}`,
      side: "yes",
    });
  }

  for (let i = 0; i < 8; i++) {
    const noPrice = Math.max(0.1, 100 - yesBase - i * 0.5 - Math.random() * 2);
    entries.push({
      price: Math.round(noPrice * 10) / 10,
      percentage: `${Math.round(noPrice)}%`,
      volume: `$${(Math.random() * 50000 + 1000).toFixed(0)}`,
      side: "no",
    });
  }

  return entries;
}

const commentPool: Comment[] = [
  { id: "c1", userName: "CryptoWhale42", userAvatar: "🐳", text: "This market is heavily skewed right now. I think there's value on the other side.", timestamp: "2 hours ago", likes: 24 },
  { id: "c2", userName: "DeFiDegen", userAvatar: "🔥", text: "Just loaded up on Yes shares. The momentum is clear.", timestamp: "3 hours ago", likes: 18 },
  { id: "c3", userName: "ChartMaster", userAvatar: "📊", text: "Looking at the 4H chart, we're approaching a key resistance level. Could go either way.", timestamp: "4 hours ago", likes: 31 },
  { id: "c4", userName: "OnChainAlpha", userAvatar: "⛓️", text: "Whale wallets have been accumulating. Bullish signal.", timestamp: "5 hours ago", likes: 15 },
  { id: "c5", userName: "RiskManager", userAvatar: "🛡️", text: "Remember to size your positions properly. This market has high volatility.", timestamp: "6 hours ago", likes: 42 },
  { id: "c6", userName: "MarketMaker_X", userAvatar: "💹", text: "Providing liquidity on both sides. Spread is tight.", timestamp: "7 hours ago", likes: 8 },
  { id: "c7", userName: "TradingBot9000", userAvatar: "🤖", text: "My model gives 62% probability for the upside scenario.", timestamp: "8 hours ago", likes: 55 },
  { id: "c8", userName: "SatoshiFan", userAvatar: "₿", text: "Long-term fundamentals haven't changed. Stay the course.", timestamp: "10 hours ago", likes: 27 },
  { id: "c9", userName: "YieldFarmer", userAvatar: "🌾", text: "The implied probability here doesn't match the options market. Arbitrage opportunity?", timestamp: "12 hours ago", likes: 19 },
  { id: "c10", userName: "NewsTrader", userAvatar: "📰", text: "Breaking news could shift this market significantly. Stay alert.", timestamp: "1 day ago", likes: 33 },
];

const holderPool: Holder[] = [
  { userName: "CryptoWhale42", position: "yes", shares: 15420, value: 11565, profit: 2340 },
  { userName: "DeFiDegen", position: "yes", shares: 8900, value: 6675, profit: 890 },
  { userName: "InstitutionalFund", position: "no", shares: 12300, value: 3075, profit: -1230 },
  { userName: "MarketMaker_X", position: "yes", shares: 22100, value: 16575, profit: 4420 },
  { userName: "RetailTrader1", position: "no", shares: 5600, value: 1400, profit: -560 },
  { userName: "AlgoTrader", position: "yes", shares: 9800, value: 7350, profit: 1470 },
  { userName: "SmartMoney", position: "yes", shares: 18500, value: 13875, profit: 3700 },
  { userName: "Contrarian", position: "no", shares: 7200, value: 1800, profit: -720 },
];

const activityPool: MarketActivity[] = [
  { id: "a1", type: "trade", userName: "CryptoWhale42", description: "Bought 5,000 Yes shares at $0.75", timestamp: "2 min ago" },
  { id: "a2", type: "trade", userName: "DeFiDegen", description: "Bought 2,400 Yes shares at $0.76", timestamp: "5 min ago" },
  { id: "a3", type: "trade", userName: "InstitutionalFund", description: "Sold 3,200 No shares at $0.25", timestamp: "8 min ago" },
  { id: "a4", type: "comment", userName: "ChartMaster", description: "Posted a new comment", timestamp: "15 min ago" },
  { id: "a5", type: "trade", userName: "RetailTrader1", description: "Bought 800 No shares at $0.24", timestamp: "22 min ago" },
  { id: "a6", type: "trade", userName: "AlgoTrader", description: "Bought 1,200 Yes shares at $0.74", timestamp: "30 min ago" },
  { id: "a7", type: "trade", userName: "MarketMaker_X", description: "Sold 4,500 Yes shares at $0.76", timestamp: "45 min ago" },
  { id: "a8", type: "trade", userName: "SmartMoney", description: "Bought 6,000 Yes shares at $0.73", timestamp: "1 hour ago" },
  { id: "a9", type: "creation", description: "Market created", timestamp: "3 days ago" },
];

function buildDetail(
  market: typeof predictionMarkets[number],
  overrides?: Partial<PredictionMarketDetail>
): PredictionMarketDetail {
  const baseYes = market.options[0]?.percentage ?? 50;
  return {
    ...market,
    slug: market.question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
    description: `Predict whether ${market.question.toLowerCase()}. This market resolves based on the official price at the specified time.`,
    expiryDate: "2026-04-01T00:00:00Z",
    createdDate: "2026-03-20T00:00:00Z",
    currentPrice: baseYes,
    priceToHit: undefined,
    totalVolume: parseFloat(market.volume.replace(/[^0-9.]/g, "")) * 1000000,
    totalLiquidity: Math.floor(Math.random() * 5000000) + 500000,
    status: "live" as const,
    resolutionCriteria: "This market will resolve to the official price reported by major exchanges at the specified expiry time.",
    relatedMarketIds: [],
    priceHistory: generatePriceHistory(baseYes, 120, 3),
    orderBook: generateOrderBook(baseYes),
    comments: commentPool.slice(0, 6 + Math.floor(Math.random() * 4)),
    topHolders: holderPool.slice(0, 5 + Math.floor(Math.random() * 3)),
    recentActivity: activityPool.slice(0, 6 + Math.floor(Math.random() * 3)),
    ...overrides,
  };
}

// Build detail data for every market
const detailOverrides: Record<string, Partial<PredictionMarketDetail>> = {
  "1": {
    description: "Predict whether Bitcoin's price will go up or down in the next 5 minutes. Based on the BTC/USD price on major exchanges.",
    expiryDate: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    currentPrice: 51,
    priceToHit: 66707.46,
    totalVolume: 39000000,
    relatedMarketIds: ["13", "8", "12", "15"],
    options: [
      { label: "Up", percentage: 51, direction: "up" as const, yesPrice: 0.75, noPrice: 0.26 },
      { label: "Down", percentage: 49, direction: "down" as const, yesPrice: 0.26, noPrice: 0.75 },
    ],
  },
  "2": {
    description: "What price level will Bitcoin reach by the end of March 2026? Resolves based on the highest BTC/USD price recorded on major exchanges during March.",
    expiryDate: "2026-04-01T00:00:00Z",
    currentPrice: 53,
    priceToHit: 150000,
    totalVolume: 91194563,
    relatedMarketIds: ["3", "7", "9", "10"],
    options: [
      { label: "↑ 150,000", percentage: 1, direction: "up" as const, yesPrice: 0.1, noPrice: 0.04, volume: "$24,098,286 Vol." },
      { label: "↑ 110,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$3,560,368 Vol." },
      { label: "↑ 105,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$2,738,825 Vol." },
      { label: "↑ 100,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$4,352,426 Vol." },
      { label: "↑ 95,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$3,656,870 Vol." },
      { label: "↑ 90,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$5,000,043 Vol." },
      { label: "↑ 85,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$3,916,838 Vol." },
      { label: "↑ 80,000", percentage: 1, direction: "up" as const, yesPrice: 0.4, noPrice: 99.7, volume: "$6,969,663 Vol." },
      { label: "↓ 65,000", percentage: 51, direction: "down" as const, yesPrice: 51.4, noPrice: 49.0, volume: "$9,032,109 Vol." },
    ],
  },
  "4": {
    description: "What price level will Ethereum reach by the end of March 2026? Resolves based on the highest ETH/USD price recorded on major exchanges during March.",
    expiryDate: "2026-04-01T00:00:00Z",
    currentPrice: 8,
    priceToHit: 4000,
    totalVolume: 22759246,
    relatedMarketIds: ["11", "14", "2"],
    options: [
      { label: "↑ 4,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$6,154,332 Vol." },
      { label: "↑ 3,800", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$1,324,061 Vol." },
      { label: "↑ 3,600", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$836,095 Vol." },
      { label: "↑ 3,400", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$784,387 Vol." },
      { label: "↑ 3,200", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$830,250 Vol." },
      { label: "↑ 3,000", percentage: 1, direction: "up" as const, yesPrice: 0.2, noPrice: 99.9, volume: "$679,387 Vol." },
      { label: "↑ 2,800", percentage: 1, direction: "up" as const, yesPrice: 0.3, noPrice: 99.8, volume: "$823,375 Vol." },
      { label: "↑ 2,600", percentage: 1, direction: "up" as const, yesPrice: 0.6, noPrice: 99.5, volume: "$1,065,143 Vol." },
      { label: "↑ 2,400", percentage: 2, direction: "up" as const, yesPrice: 1.7, noPrice: 98.5, volume: "$1,418,407 Vol." },
      { label: "↓ 1,800", percentage: 8, direction: "down" as const, yesPrice: 8.0, noPrice: 92.5, volume: "$2,200,000 Vol." },
    ],
  },
  "3": {
    relatedMarketIds: ["2", "7", "9", "10"],
    totalVolume: 3000000,
  },
  "5": {
    relatedMarketIds: ["6"],
    totalVolume: 5000000,
  },
  "6": {
    relatedMarketIds: ["5"],
    totalVolume: 3000000,
  },
  "7": {
    relatedMarketIds: ["2", "3", "9", "10"],
    totalVolume: 8000000,
  },
  "8": {
    relatedMarketIds: ["13", "4"],
    totalVolume: 6000000,
  },
  "9": {
    relatedMarketIds: ["2", "3", "7", "10"],
    totalVolume: 4000000,
  },
  "10": {
    relatedMarketIds: ["2", "3", "7", "9"],
    totalVolume: 7000000,
  },
  "11": {
    relatedMarketIds: ["4", "14"],
    totalVolume: 2000000,
  },
  "12": {
    relatedMarketIds: ["1"],
    totalVolume: 1500000,
  },
  "13": {
    relatedMarketIds: ["8", "1"],
    totalVolume: 11000000,
  },
  "14": {
    relatedMarketIds: ["4", "11"],
    totalVolume: 3200000,
  },
  "15": {
    relatedMarketIds: ["1"],
    totalVolume: 2100000,
  },
};

const marketDetailsMap = new Map<string, PredictionMarketDetail>();

predictionMarkets.forEach((m) => {
  marketDetailsMap.set(m.id, buildDetail(m, detailOverrides[m.id]));
});

export function getPredictionById(id: string): PredictionMarketDetail | undefined {
  return marketDetailsMap.get(id);
}

export function getRelatedPredictions(marketId: string): PredictionMarketDetail[] {
  const market = marketDetailsMap.get(marketId);
  if (!market || !market.relatedMarketIds) return [];
  return market.relatedMarketIds
    .map((rid) => marketDetailsMap.get(rid))
    .filter(Boolean) as PredictionMarketDetail[];
}

export function getAllMarketDetails(): PredictionMarketDetail[] {
  return Array.from(marketDetailsMap.values());
}

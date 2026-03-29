import { Vault, VaultDetail, PoolFilter } from "@/types/vault";

function generateSparkline(length: number, trend: "up" | "down" | "flat"): number[] {
  const data: number[] = [];
  let value = 50 + Math.random() * 50;
  for (let i = 0; i < length; i++) {
    const drift = trend === "up" ? 0.3 : trend === "down" ? -0.3 : 0;
    value += drift + (Math.random() - 0.5) * 4;
    value = Math.max(10, Math.min(100, value));
    data.push(parseFloat(value.toFixed(2)));
  }
  return data;
}

function generateHistory(days: number, base: number) {
  const data: { time: number; value: number }[] = [];
  const now = Date.now();
  let v = base;
  for (let i = days; i >= 0; i--) {
    v += (Math.random() - 0.48) * base * 0.02;
    v = Math.max(base * 0.5, v);
    data.push({ time: now - i * 86400000, value: parseFloat(v.toFixed(2)) });
  }
  return data;
}

export const poolFilters: PoolFilter[] = [
  { label: "All markets", value: "all" },
  { label: "Favorites", value: "favorites" },
  { label: "DWA", value: "dwa" },
  { label: "DeFi", value: "defi" },
  { label: "Meme", value: "meme" },
  { label: "Layer 1", value: "layer1" },
  { label: "Layer 2", value: "layer2" },
];

export const glvVaults: Vault[] = [
  {
    id: "glv-weth-usdc",
    name: "GLV",
    type: "GLV",
    assets: [
      { symbol: "WETH", name: "Wrapped ETH", logo: "E", color: "#627eea" },
      { symbol: "USDC", name: "USD Coin", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WETH-USDC",
    tvl: 90130000,
    tvlSupply: "17.44m GLV",
    balance: null,
    feeApy: 16.02,
    annualPerformance: 14.66,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "defi"],
  },
  {
    id: "glv-btc-usdc",
    name: "GLV",
    type: "GLV",
    assets: [
      { symbol: "BTC", name: "Bitcoin", logo: "₿", color: "#f7931a" },
      { symbol: "USDC", name: "USD Coin", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "BTC-USDC",
    tvl: 11520000,
    tvlSupply: "9.03m GLV",
    balance: null,
    feeApy: 11.49,
    annualPerformance: 12.2,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "defi"],
  },
];

export const gmPools: Vault[] = [
  {
    id: "gm-vvv-usd",
    name: "VVV/USD",
    type: "GM",
    assets: [
      { symbol: "VVV", name: "VVV", logo: "V", color: "#f59e0b" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WETH+USDC",
    tvl: 474300,
    tvlSupply: "749.35k GM",
    balance: null,
    feeApy: 108.51,
    annualPerformance: 35.85,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "defi"],
  },
  {
    id: "gm-kta-usd",
    name: "KTA/USD",
    type: "GM",
    assets: [
      { symbol: "KTA", name: "KTA", logo: "K", color: "#8b5cf6" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WETH+USDC",
    tvl: 458500,
    tvlSupply: "510.9k GM",
    balance: null,
    feeApy: 52.37,
    annualPerformance: 84.22,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "defi"],
  },
  {
    id: "gm-well-usd",
    name: "WELL/USD",
    type: "GM",
    assets: [
      { symbol: "WELL", name: "WELL", logo: "W", color: "#06b6d4" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WETH+USDC",
    tvl: 636490,
    tvlSupply: "1.67k GM",
    balance: null,
    feeApy: 39.59,
    annualPerformance: 53.95,
    sparklineData: generateSparkline(30, "flat"),
    isFavorite: false,
    category: ["all", "defi"],
  },
  {
    id: "gm-sol-usd",
    name: "SOL/USD",
    type: "GM",
    assets: [
      { symbol: "SOL", name: "Solana", logo: "S", color: "#9945ff" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "SOL+SOL",
    tvl: 153740,
    tvlSupply: "374.74k GM",
    balance: null,
    feeApy: 38.53,
    annualPerformance: 5.31,
    sparklineData: generateSparkline(30, "down"),
    isFavorite: false,
    category: ["all", "layer1"],
  },
  {
    id: "gm-wif-usd",
    name: "WIF/USD",
    type: "GM",
    assets: [
      { symbol: "WIF", name: "dogwifhat", logo: "W", color: "#c2a633" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WIF+USDC",
    tvl: 9080,
    tvlSupply: "51.88k GM",
    balance: null,
    feeApy: 34.55,
    annualPerformance: 8.94,
    sparklineData: generateSparkline(30, "flat"),
    isFavorite: false,
    category: ["all", "meme"],
  },
  {
    id: "gm-anime-usd",
    name: "ANIME/USD",
    type: "GM",
    assets: [
      { symbol: "ANIME", name: "Anime", logo: "A", color: "#ef4444" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "ANIME+USDC",
    tvl: 4870,
    tvlSupply: "9.25k GM",
    balance: null,
    feeApy: 34.19,
    annualPerformance: 17.79,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "meme"],
  },
  {
    id: "gm-eth-usd",
    name: "ETH/USD",
    type: "GM",
    assets: [
      { symbol: "ETH", name: "Ethereum", logo: "E", color: "#627eea" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WETH+USDC",
    tvl: 28450000,
    tvlSupply: "24.1m GM",
    balance: null,
    feeApy: 22.14,
    annualPerformance: 6.83,
    sparklineData: generateSparkline(30, "flat"),
    isFavorite: false,
    category: ["all", "layer1"],
  },
  {
    id: "gm-btc-usd",
    name: "BTC/USD",
    type: "GM",
    assets: [
      { symbol: "BTC", name: "Bitcoin", logo: "₿", color: "#f7931a" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "BTC+USDC",
    tvl: 42160000,
    tvlSupply: "35.2m GM",
    balance: null,
    feeApy: 18.72,
    annualPerformance: 12.41,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "layer1"],
  },
  {
    id: "gm-doge-usd",
    name: "DOGE/USD",
    type: "GM",
    assets: [
      { symbol: "DOGE", name: "Dogecoin", logo: "D", color: "#c2a633" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "WETH+USDC",
    tvl: 312400,
    tvlSupply: "1.87m GM",
    balance: null,
    feeApy: 28.91,
    annualPerformance: 15.23,
    sparklineData: generateSparkline(30, "flat"),
    isFavorite: false,
    category: ["all", "meme"],
  },
  {
    id: "gm-arb-usd",
    name: "ARB/USD",
    type: "GM",
    assets: [
      { symbol: "ARB", name: "Arbitrum", logo: "A", color: "#2d6af6" },
      { symbol: "USDC", name: "USDC", logo: "$", color: "#2775ca" },
    ],
    pairLabel: "ARB+USDC",
    tvl: 1240000,
    tvlSupply: "8.1m GM",
    balance: null,
    feeApy: 15.83,
    annualPerformance: 9.67,
    sparklineData: generateSparkline(30, "up"),
    isFavorite: false,
    category: ["all", "layer2"],
  },
];

export function getVaultById(id: string): VaultDetail | null {
  const all = [...glvVaults, ...gmPools];
  const vault = all.find((v) => v.id === id);
  if (!vault) return null;
  return {
    ...vault,
    description: `${vault.name} is a ${vault.type === "GLV" ? "yield-optimized liquidity vault" : "single-market liquidity pool"} providing exposure to ${vault.pairLabel}. Earn fees from trading activity, swaps, and spreads on the Cyclespace protocol.`,
    totalSupply: vault.tvl * 0.8,
    volume24h: vault.tvl * (0.05 + Math.random() * 0.15),
    feesEarned: vault.tvl * 0.001 * (1 + Math.random()),
    utilization: 45 + Math.random() * 40,
    priceHistory: generateHistory(90, 1),
    tvlHistory: generateHistory(90, vault.tvl),
    apyHistory: generateHistory(90, vault.feeApy),
    composition: vault.assets.map((a, i) => ({
      asset: a.symbol,
      percentage: i === 0 ? 55 + Math.random() * 10 : 35 + Math.random() * 10,
      color: a.color,
    })),
  };
}

export const totalTVL = 206579310;

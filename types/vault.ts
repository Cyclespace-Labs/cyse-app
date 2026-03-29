export interface VaultAsset {
  symbol: string;
  name: string;
  logo: string;
  color: string;
}

export interface Vault {
  id: string;
  name: string;
  type: "GLV" | "GM";
  assets: VaultAsset[];
  pairLabel: string;
  tvl: number;
  tvlSupply: string;
  balance: number | null;
  feeApy: number;
  annualPerformance: number;
  sparklineData: number[];
  isFavorite: boolean;
  category: string[];
}

export interface VaultDetail extends Vault {
  description: string;
  totalSupply: number;
  volume24h: number;
  feesEarned: number;
  utilization: number;
  priceHistory: { time: number; value: number }[];
  tvlHistory: { time: number; value: number }[];
  apyHistory: { time: number; value: number }[];
  composition: { asset: string; percentage: number; color: string }[];
}

export interface PoolFilter {
  label: string;
  value: string;
}

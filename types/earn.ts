export interface EarnAsset {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  color: string;
}

export interface EarnOpportunity {
  id: string;
  title: string;
  subtitle: string;
  type: "GMX" | "GLV" | "GM";
  logo: string;
  color: string;
  apy: number;
  apyLabel: string;
  network: string;
}

export interface InfoCard {
  id: string;
  type: "GMX" | "GLV" | "GM";
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  readMoreUrl: string;
  bullets: string[];
  ctaLabel: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface YieldAsset {
  name: string;
  type: string;
  apy: number | null;
  apyLabel: string;
}

export interface YieldNetwork {
  network: string;
  color: string;
  assets: YieldAsset[];
}

export interface ExchangeOption {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface PortfolioStats {
  totalInvestmentValue: number;
  totalEarned: number;
  totalPendingRewards: number;
  buybackAccrued: number;
  buybackToken: string;
}

export interface UserAsset {
  id: string;
  vaultName: string;
  type: "GLV" | "GM" | "GMX";
  balance: number;
  value: number;
  rewards: number;
  apy: number;
}

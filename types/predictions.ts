export interface PredictionOption {
  label: string;
  percentage: number;
  direction: "up" | "down";
  yesPrice?: number;
  noPrice?: number;
  volume?: string;
}

export interface PredictionMarket {
  id: string;
  question: string;
  tokenSymbol: string;
  tokenIcon: string;
  iconColor: string;
  options: PredictionOption[];
  volume: string;
  isLive: boolean;
  category: string;
  timeframe: string;
  yesPercentage?: number;
  noPercentage?: number;

  slug?: string;
  description?: string;
  expiryDate?: string;
  createdDate?: string;
  currentPrice?: number;
  priceToHit?: number;
  totalVolume?: number;
  totalLiquidity?: number;
  status?: "live" | "closed" | "resolved";
  resolutionCriteria?: string;
  relatedMarketIds?: string[];
}

export interface PredictionCategory {
  label: string;
  count: number;
  icon?: string;
}

export interface PricePoint {
  time: number;
  value: number;
  volume?: number;
}

export interface PredictionOrderBookEntry {
  price: number;
  percentage: string;
  volume: string;
  side: "yes" | "no";
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Holder {
  userName: string;
  position: "yes" | "no";
  shares: number;
  value: number;
  profit: number;
}

export interface MarketActivity {
  id: string;
  type: "trade" | "comment" | "resolution" | "creation";
  userName?: string;
  description: string;
  timestamp: string;
}

export interface PredictionMarketDetail extends PredictionMarket {
  priceHistory: PricePoint[];
  orderBook: PredictionOrderBookEntry[];
  comments: Comment[];
  topHolders: Holder[];
  recentActivity: MarketActivity[];
}

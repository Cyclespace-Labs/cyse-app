export interface PredictionOption {
  label: string;
  percentage: number;
  direction: "up" | "down";
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
}

export interface PredictionCategory {
  label: string;
  count: number;
  icon?: string;
}

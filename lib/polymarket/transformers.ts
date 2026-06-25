// Data transformation utilities for Polymarket API responses
// Converts Polymarket data structures to internal application types

import { PredictionOption, PredictionMarket, PricePoint } from '@/types/predictions';

/**
 * Polymarket Event interface from Gamma API
 */
export interface PolymarketEvent {
  id: string;
  ticker?: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  liquidity?: number;
  volume?: number;
  category?: string;
  subcategory?: string;
  markets?: PolymarketMarket[];
  tags?: PolymarketTag[];
  [key: string]: any;
}

/**
 * Polymarket Market interface from Gamma API
 */
export interface PolymarketMarket {
  id: string;
  question?: string;
  conditionId: string;
  slug?: string;
  endDate?: string;
  category?: string;
  liquidity?: string;
  volume?: string;
  volumeNum?: number;
  liquidityNum?: number;
  active?: boolean;
  closed?: boolean;
  marketType?: string;
  formatType?: string;
  clobTokenIds?: string;
  outcomes?: string;
  outcomePrices?: string;
  outcomePricesNum?: number[];
  price?: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  enableOrderBook?: boolean;
  events?: PolymarketEvent[];
  tags?: PolymarketTag[];
  image?: string;
  icon?: string;
  [key: string]: any;
}

/**
 * Polymarket Tag interface
 */
export interface PolymarketTag {
  id: string;
  label?: string;
  slug?: string;
  [key: string]: any;
}

/**
 * Transform Polymarket Event to internal format
 */
export function transformPolymarketEvent(event: PolymarketEvent): Partial<PredictionMarket> {
  // Get the first market from the event if available
  const market = event.markets?.[0];
  
  return {
    id: event.id,
    question: event.title || event.subtitle || event.ticker || 'Unknown Market',
    category: event.category || event.subcategory || 'General',
    description: event.description,
    expiryDate: event.endDate,
    createdDate: event.startDate,
    totalVolume: event.volume,
    totalLiquidity: event.liquidity,
    status: event.closed ? 'closed' : (event.active ? 'live' : 'resolved'),
    slug: event.slug,
    // Additional fields from market if available
    ...(market ? transformPolymarketMarketBasic(market) : {}),
  };
}

/**
 * Transform Polymarket Market to internal format (basic fields)
 */
export function transformPolymarketMarketBasic(market: PolymarketMarket): Partial<PredictionMarket> {
  return {
    id: market.id,
    conditionId: market.conditionId,
    question: market.question || 'Unknown Market',
    category: market.category || 'General',
    expiryDate: market.endDate,
    totalVolume: market.volumeNum || parseFloat(market.volume || '0'),
    totalLiquidity: market.liquidityNum || parseFloat(market.liquidity || '0'),
    status: market.closed ? 'closed' : (market.active ? 'live' : 'resolved'),
    slug: market.slug,
    clobTokenIds: market.clobTokenIds,
    enableOrderBook: market.enableOrderBook,
    currentPrice: market.lastTradePrice || market.price,
  };
}

/**
 * Transform Polymarket Market to full PredictionMarket format
 */
export function transformPolymarketMarket(market: PolymarketMarket): PredictionMarket {
  const options = transformOutcomes(market.outcomes, market.outcomePricesNum);
  
  // Determine token symbol and icon based on category or tags, prioritizing API URLs
  const tokenInfo = getTokenInfo(market, market.image, market.icon);
  
  return {
    id: market.id,
    conditionId: market.conditionId,
    question: market.question || 'Unknown Market',
    tokenSymbol: tokenInfo.symbol,
    tokenIcon: tokenInfo.icon,
    iconColor: tokenInfo.color,
    options,
    volume: formatVolume(market.volumeNum || parseFloat(market.volume || '0')),
    isLive: (market.active && !market.closed) || false,
    category: market.category || 'General',
    timeframe: getTimeframe(market.endDate),
    slug: market.slug,
    description: market.description || market.question,
    expiryDate: market.endDate,
    totalVolume: market.volumeNum || parseFloat(market.volume || '0'),
    totalLiquidity: market.liquidityNum || parseFloat(market.liquidity || '0'),
    status: market.closed ? 'closed' : (market.active ? 'live' : 'resolved'),
    clobTokenIds: market.clobTokenIds,
    enableOrderBook: market.enableOrderBook,
    currentPrice: market.lastTradePrice || market.price,
    bestBid: market.bestBid,
    bestAsk: market.bestAsk,
    image: market.image || '', // Added missing property
    icon: market.icon || '',   // Added missing property
  };
}

/**
 * Transform outcomes/outcomePrices to PredictionOption array
 */
export function transformOutcomes(
  outcomes: string | undefined,
  outcomePrices: number[] | undefined
): PredictionOption[] {
  if (!outcomes) {
    return [];
  }

  // Parse outcomes string (e.g., "Yes,No" or "Yes,No,Maybe")
  const outcomeLabels = outcomes.split(',');
  
  if (!outcomePrices || outcomePrices.length === 0) {
    // If no prices, create options with 50/50 split
    return outcomeLabels.map((label, index) => ({
      label: label.trim(),
      percentage: 50,
      direction: index === 0 ? 'up' : 'down',
    }));
  }

  // Map prices to percentages (price is already a percentage 0-1)
  return outcomeLabels.map((label, index) => {
    const price = outcomePrices[index] || 0.5;
    const percentage = Math.round(price * 100);
    
    return {
      label: label.trim(),
      percentage,
      direction: index === 0 ? 'up' : 'down',
      yesPrice: price,
      noPrice: index === 0 ? 1 - price : price,
    };
  });
}

/**
 * Get token information based on market category/tags, with API URL fallback
 */
function getTokenInfo(market: PolymarketMarket, imageUrl?: string, iconUrl?: string): {
  symbol: string;
  icon: string;
  color: string;
} {
  // 1. Prioritize explicit URLs from the API response
  if (imageUrl) {
    return { symbol: 'API', icon: imageUrl, color: '#007bff' }; // Use a distinct color for API-provided images
  }
  if (iconUrl) {
    return { symbol: 'API', icon: iconUrl, color: '#007bff' };
  }

  // 2. Fallback to category/tag analysis (existing logic)
  const category = market.category?.toLowerCase() || '';
  const tags = market.tags?.map(t => t.label?.toLowerCase()) || [];

  // Check for specific crypto tokens
  if (category.includes('bitcoin') || tags.includes('bitcoin') || tags.includes('btc')) {
    return { symbol: 'BTC', icon: '₿', color: '#f7931a' };
  }
  if (category.includes('ethereum') || tags.includes('ethereum') || tags.includes('eth')) {
    return { symbol: 'ETH', icon: 'Ξ', color: '#627eea' };
  }
  if (category.includes('solana') || tags.includes('solana') || tags.includes('sol')) {
    return { symbol: 'SOL', icon: '◎', color: '#00ffa3' };
  }
  if (category.includes('xrp') || tags.includes('xrp')) {
    return { symbol: 'XRP', icon: '✕', color: '#23292f' };
  }
  if (category.includes('dogecoin') || tags.includes('dogecoin') || tags.includes('doge')) {
    return { symbol: 'DOGE', icon: 'Ð', color: '#c2a633' };
  }

  // Default crypto icon
  return { symbol: 'CRYPTO', icon: '◈', color: '#6366f1' };
}

/**
 * Format volume to human-readable string
 */
function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M Vol.`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K Vol.`;
  }
  return `$${volume.toFixed(0)} Vol.`;
}

/**
 * Get timeframe from end date
 */
function getTimeframe(endDate: string | undefined): string {
  if (!endDate) {
    return 'Unknown';
  }

  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 1) {
    return '< 1 Hour';
  }
  if (diffHours < 24) {
    return `${Math.round(diffHours)} Hours`;
  }
  if (diffDays < 7) {
    return `${Math.round(diffDays)} Days`;
  }
  if (diffDays < 30) {
    return `${Math.round(diffDays / 7)} Weeks`;
  }
  if (diffDays < 365) {
    return `${Math.round(diffDays / 30)} Months`;
  }
  return `${Math.round(diffDays / 365)} Years`;
}

/**
 * Transform CLOB order book to internal format
 */
export interface ClobOrderBook {
  asks: Array<{ price: string | number; size: string | number }>;
  bids: Array<{ price: string | number; size: string | number }>;
  lastPrice?: string | number;
}

export function transformClobOrderBook(clobOrderBook: ClobOrderBook, fallbackPrice?: number): {
  asks: Array<{ price: number; percentage: string; volume: string; side: 'yes' | 'no' }>;
  bids: Array<{ price: number; percentage: string; volume: string; side: 'yes' | 'no' }>;
  lastPrice: number;
  spread: number;
} {
  const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  };

  const transformLevel = (level: { price: string | number; size: string | number }) => {
    const price = parseNumber(level.price);
    return {
      price,
      percentage: `${(price * 100).toFixed(1)}%`,
      volume: parseNumber(level.size).toFixed(2),
      side: price > 0.5 ? 'yes' : 'no' as 'yes' | 'no',
    };
  };

  const asks = clobOrderBook.asks.map(transformLevel);
  const bids = clobOrderBook.bids.map(transformLevel);

  // Calculate spread
  const spread = asks.length > 0 && bids.length > 0 
    ? asks[0].price - bids[0].price 
    : 0;

  // Use lastPrice from order book or fallback
  const lastPrice = clobOrderBook.lastPrice 
    ? parseNumber(clobOrderBook.lastPrice) 
    : (fallbackPrice || 0);

  return {
    asks,
    bids,
    lastPrice,
    spread,
  };
}

/**
 * Transform price history to PricePoint array
 */
export function transformPriceHistory(prices: Array<{ price: number; timestamp: number }>): PricePoint[] {
  return prices.map(p => ({
    time: p.timestamp,
    value: p.price,
  }));
}

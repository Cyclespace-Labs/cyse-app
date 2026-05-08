import { PredictionMarket, PredictionCategory } from "@/types/predictions";

/**
 * Fetch crypto events from Polymarket API
 * Returns categories and their counts based on crypto events
 */
export async function fetchCryptoEvents(limit: number = 100, afterCursor?: string) {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (afterCursor) {
      params.append('after_cursor', afterCursor);
    }

    const response = await fetch(`/api/polymarket/events?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching crypto events:', error);
    return { events: [], next_cursor: undefined };
  }
}

/**
 * Fetch crypto markets from Polymarket API
 * Returns markets with pagination support
 */
export async function fetchCryptoMarkets(limit: number = 100, afterCursor?: string, closed: boolean = false) {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('closed', closed.toString());
    if (afterCursor) {
      params.append('after_cursor', afterCursor);
    }

    const response = await fetch(`/api/polymarket/markets?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch markets');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching crypto markets:', error);
    return { markets: [], next_cursor: undefined };
  }
}

/**
 * Fetch a single market by ID
 */
export async function fetchMarketById(id: string) {
  try {
    const response = await fetch(`/api/polymarket/markets/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market by ID:', error);
    return null;
  }
}

/**
 * Fetch order book for a market
 */
export async function fetchMarketOrderBook(tokenId: string) {
  try {
    const response = await fetch(`/api/polymarket/orderbook?token_id=${tokenId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order book');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching order book:', error);
    return null;
  }
}

/**
 * Get dynamic categories from crypto events
 * This replaces the static predictionCategories with real data
 */
export async function getPredictionCategories(): Promise<PredictionCategory[]> {
  try {
    const data = await fetchCryptoEvents(100);
    const events = data.events || [];

    // Extract unique categories from events
    const categoryMap = new Map<string, number>();
    
    events.forEach((event: any) => {
      const category = event.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // Convert to array and add "All" category
    const categories: PredictionCategory[] = [
      { label: 'All', count: events.length },
      ...Array.from(categoryMap.entries()).map(([label, count]) => ({
        label,
        count,
      })),
    ];

    return categories;
  } catch (error) {
    console.error('Error getting prediction categories:', error);
    // Fallback to default categories
    return [
      { label: 'All', count: 0 },
      { label: 'Bitcoin', count: 0 },
      { label: 'Ethereum', count: 0 },
      { label: 'Solana', count: 0 },
    ];
  }
}

/**
 * Get prediction markets from Polymarket API
 * This replaces the static predictionMarkets with real data
 */
export async function getPredictionMarkets(limit: number = 100, afterCursor?: string): Promise<PredictionMarket[]> {
  try {
    const data = await fetchCryptoMarkets(limit, afterCursor);
    return data.markets || [];
  } catch (error) {
    console.error('Error getting prediction markets:', error);
    return [];
  }
}

// Keep exports for backward compatibility during transition
export const predictionCategories: PredictionCategory[] = [
  { label: "All", count: 0 }, // Will be replaced by dynamic data
  { label: "Bitcoin", count: 0 },
  { label: "Ethereum", count: 0 },
  { label: "Solana", count: 0 },
];

export const predictionMarkets: PredictionMarket[] = []; // Will be replaced by API data

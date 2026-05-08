import {
  PredictionMarketDetail,
  PricePoint,
  PredictionOrderBookEntry,
  OrderBookData,
  Comment,
  Holder,
  MarketActivity,
} from "@/types/predictions";
import { fetchMarketById, fetchMarketOrderBook } from "./predictionsData";

/**
 * Get prediction market detail by ID from Polymarket API
 */
export async function getPredictionById(id: string): Promise<PredictionMarketDetail | null> {
  try {
    const data = await fetchMarketById(id);
    if (!data) {
      return null;
    }

    const market = data.market;
    const orderBook = data.orderBook;

    // Transform order book to PredictionOrderBookEntry format
    const orderBookEntries: PredictionOrderBookEntry[] = [];
    if (orderBook) {
      orderBook.asks.forEach((ask: any) => {
        orderBookEntries.push({
          price: ask.price,
          percentage: ask.percentage,
          volume: ask.volume,
          side: ask.side,
        });
      });
      orderBook.bids.forEach((bid: any) => {
        orderBookEntries.push({
          price: bid.price,
          percentage: bid.percentage,
          volume: bid.volume,
          side: bid.side,
        });
      });
    }

    // Transform order book to OrderBookData format (simplified for now)
    const orderBookData: OrderBookData | undefined = orderBook ? {
      asks: [], // Will be populated with detailed order book data if needed
      bids: [],
      lastPrice: orderBook.lastPrice,
      spread: orderBook.spread,
    } : undefined;

    // For now, use empty arrays for comments, holders, and activity
    // These can be fetched from Data API later if needed
    const comments: Comment[] = [];
    const topHolders: Holder[] = [];
    const recentActivity: MarketActivity[] = [];

    // Generate mock price history for now (can be replaced with real data from CLOB API)
    const priceHistory: PricePoint[] = generatePriceHistory(market.currentPrice || 50, 120, 3);

    return {
      ...market,
      priceHistory,
      orderBook: orderBookEntries,
      orderBookData,
      comments,
      topHolders,
      recentActivity,
    };
  } catch (error) {
    console.error('Error getting prediction by ID:', error);
    return null;
  }
}

/**
 * Get related predictions for a market
 * For now, this will return empty array until we implement related market logic
 */
export async function getRelatedPredictions(marketId: string): Promise<PredictionMarketDetail[]> {
  try {
    // TODO: Implement related market logic based on:
    // - Same event
    // - Similar tags
    // - Same category
    return [];
  } catch (error) {
    console.error('Error getting related predictions:', error);
    return [];
  }
}

/**
 * Generate price history (fallback for when real data is not available)
 * This is a simplified version for backward compatibility
 */
function generatePriceHistory(baseValue: number, points: number, volatility: number): PricePoint[] {
  const now = Math.floor(Date.now() / 1000);
  const interval = 300; // 5 min intervals
  const history: PricePoint[] = [];
  let value = baseValue || 50;

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

/**
 * Get all market details (for backward compatibility)
 */
export async function getAllMarketDetails(): Promise<PredictionMarketDetail[]> {
  try {
    const { fetchCryptoMarkets } = await import("./predictionsData");
    const data = await fetchCryptoMarkets(100);
    const markets = data.markets || [];

    const details: PredictionMarketDetail[] = [];
    for (const market of markets) {
      const detail = await getPredictionById(market.id);
      if (detail) {
        details.push(detail);
      }
    }

    return details;
  } catch (error) {
    console.error('Error getting all market details:', error);
    return [];
  }
}

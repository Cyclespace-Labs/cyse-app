// Polymarket Single Market API Route
// Fetches a single market by ID with order book data

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';
import { transformPolymarketMarket } from '@/lib/polymarket/transformers';
import { createPublicClient } from '@/lib/polymarket/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check cache first
    const cacheParams = { id };
    const cached = getCached('polymarket:market', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch markets from Gamma API (filtering by tag_slug=crypto for crypto markets)
    const gammaResponse = await fetch(
      `${POLYMARKET_CONFIG.GAMMA_API_BASE}/markets?tag_slug=crypto&limit=100`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!gammaResponse.ok) {
      throw new Error(`Gamma API error: ${gammaResponse.status} ${gammaResponse.statusText}`);
    }

    const marketsData = await gammaResponse.json();
    
    // Find the market by ID in the response
    // The API returns an array of markets
    const marketsArray = Array.isArray(marketsData) ? marketsData : (marketsData.markets || []);
    const marketData = marketsArray.find((m: any) => m.id === id || m.conditionId === id);

    if (!marketData) {
      return NextResponse.json(
        { error: 'Market not found', message: `Market with ID ${id} not found in crypto markets` },
        { status: 404 }
      );
    }

    const market = transformPolymarketMarket(marketData);

    // Fetch order book from CLOB API if market has clobTokenIds
    let orderBook = null;
    if (market.clobTokenIds && market.enableOrderBook) {
      try {
        const client = await createPublicClient();
        const clobOrderBook = await client.getOrderBook(market.clobTokenIds);
        orderBook = {
          asks: clobOrderBook.asks || [],
          bids: clobOrderBook.bids || [],
          lastPrice: market.currentPrice || 0.5,
          spread: 0,
        };
      } catch (error) {
        console.error('Error fetching order book:', error);
        // Continue without order book data
      }
    }

    const result = {
      market,
      orderBook,
    };

    // Cache the result (shorter TTL for real-time data)
    setCached('polymarket:market', cacheParams, result, POLYMARKET_CONFIG.CACHE_TTL.MARKET_DETAIL);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Polymarket market:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

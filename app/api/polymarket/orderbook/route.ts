// Polymarket Order Book API Route
// Fetches order book data from CLOB API (public, no auth required)

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';
import { transformClobOrderBook } from '@/lib/polymarket/transformers';
import { createPublicClient } from '@/lib/polymarket/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenId = searchParams.get('token_id');
    
    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheParams = { token_id: tokenId };
    const cached = getCached('polymarket:orderbook', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch from CLOB API
    const client = await createPublicClient();
    const clobOrderBook = await client.getOrderBook(tokenId);

    // Transform data
    const orderBook = transformClobOrderBook(clobOrderBook);

    // Cache the result (short TTL for real-time feel)
    setCached('polymarket:orderbook', cacheParams, orderBook, POLYMARKET_CONFIG.CACHE_TTL.ORDERBOOK);

    return NextResponse.json(orderBook);
  } catch (error) {
    console.error('Error fetching Polymarket order book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order book', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

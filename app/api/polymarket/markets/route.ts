// Polymarket Markets API Route
// Fetches crypto-related markets from Gamma API with caching

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';
import { transformPolymarketMarket } from '@/lib/polymarket/transformers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const afterCursor = searchParams.get('after_cursor') || undefined;
    const closed = searchParams.get('closed') === 'true';
    
    // Check cache first
    const cacheParams = { limit, after_cursor: afterCursor || '', closed };
    const cached = getCached('polymarket:markets', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    queryParams.append('tag_slug', POLYMARKET_CONFIG.CRYPTO_TAG_SLUG);
    queryParams.append('closed', closed.toString());
    queryParams.append('include_tag', 'true');
    if (afterCursor) {
      queryParams.append('after_cursor', afterCursor);
    }

    // Fetch from Gamma API
    const response = await fetch(
      `${POLYMARKET_CONFIG.GAMMA_API_BASE}/markets/keyset?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: POLYMARKET_CONFIG.CACHE_TTL.MARKETS },
      }
    );

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform data
    let markets = data.markets || data.data || [];
    if (Array.isArray(markets)) {
      markets = markets.map((market: any) => transformPolymarketMarket(market));
    }

    const result = {
      markets,
      next_cursor: data.next_cursor,
    };

    // Cache the result
    setCached('polymarket:markets', cacheParams, result, POLYMARKET_CONFIG.CACHE_TTL.MARKETS);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

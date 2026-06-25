// Polymarket Events API Route
// Fetches crypto-related events from Gamma API with caching

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';
import { transformPolymarketEvent } from '@/lib/polymarket/transformers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const afterCursor = searchParams.get('after_cursor') || undefined;
    
    // Check cache first
    const cacheParams = { limit, after_cursor: afterCursor || '', tag_slug: POLYMARKET_CONFIG.CRYPTO_TAG_SLUG };
    const cached = getCached('polymarket:events', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    queryParams.append('tag_slug', POLYMARKET_CONFIG.CRYPTO_TAG_SLUG);
    queryParams.append('active', 'true');
    if (afterCursor) {
      queryParams.append('after_cursor', afterCursor);
    }

    // Fetch from Gamma API
    const response = await fetch(
      `${POLYMARKET_CONFIG.GAMMA_API_BASE}/events/keyset?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: POLYMARKET_CONFIG.CACHE_TTL.EVENTS },
      }
    );

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform data
    let events = data.events || data.data || [];
    if (Array.isArray(events)) {
      events = events.map((event: any) => transformPolymarketEvent(event));
    }

    const result = {
      events,
      next_cursor: data.next_cursor,
    };

    // Cache the result
    setCached('polymarket:events', cacheParams, result, POLYMARKET_CONFIG.CACHE_TTL.EVENTS);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Polymarket events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


// Polymarket Open Interest API Route
// Fetches open interest data from Data API

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market');
    
    // Check cache first
    const cacheParams = { market: market || 'all' };
    const cached = getCached('polymarket:open-interest', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (market) {
      queryParams.append('market', market);
    }

    // Fetch from Data API
    const response = await fetch(
      `${POLYMARKET_CONFIG.DATA_API_BASE}/oi?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Data API error: ${response.status} ${response.statusText}`);
    }

    const openInterest = await response.json();

    // Cache the result
    setCached('polymarket:open-interest', cacheParams, openInterest, POLYMARKET_CONFIG.CACHE_TTL.OPEN_INTEREST);

    return NextResponse.json(openInterest);
  } catch (error) {
    console.error('Error fetching Polymarket open interest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch open interest', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

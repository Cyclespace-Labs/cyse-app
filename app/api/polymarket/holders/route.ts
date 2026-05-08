// Polymarket Holders API Route
// Fetches top holders for a market from Data API

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheParams = { market, limit };
    const cached = getCached('polymarket:holders', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    queryParams.append('market', market);

    // Fetch from Data API
    const response = await fetch(
      `${POLYMARKET_CONFIG.DATA_API_BASE}/holders?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Data API error: ${response.status} ${response.statusText}`);
    }

    const holders = await response.json();

    // Cache the result
    setCached('polymarket:holders', cacheParams, holders, POLYMARKET_CONFIG.CACHE_TTL.HOLDERS);

    return NextResponse.json(holders);
  } catch (error) {
    console.error('Error fetching Polymarket holders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holders', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

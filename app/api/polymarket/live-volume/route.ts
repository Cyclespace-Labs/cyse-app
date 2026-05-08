// Polymarket Live Volume API Route
// Fetches live volume for an event from Data API

import { NextRequest, NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';
import { getCached, setCached } from '@/lib/polymarket/cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheParams = { id };
    const cached = getCached('polymarket:live-volume', cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch from Data API
    const response = await fetch(
      `${POLYMARKET_CONFIG.DATA_API_BASE}/live-volume?id=${encodeURIComponent(id)}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Data API error: ${response.status} ${response.statusText}`);
    }

    const liveVolume = await response.json();

    // Cache the result
    setCached('polymarket:live-volume', cacheParams, liveVolume, POLYMARKET_CONFIG.CACHE_TTL.LIVE_VOLUME);

    return NextResponse.json(liveVolume);
  } catch (error) {
    console.error('Error fetching Polymarket live volume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live volume', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

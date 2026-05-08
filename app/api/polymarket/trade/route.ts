// Polymarket Trade API Route
// Places orders on CLOB API (requires authentication)

import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/polymarket/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenID, price, size, side, tickSize = '0.01', negRisk = false } = body;

    if (!tokenID || !price || !size || !side) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenID, price, size, side' },
        { status: 400 }
      );
    }

    // Create authenticated client
    const client = await createAuthenticatedClient();

    // Create and post order
    const order = await client.createAndPostOrder(
      {
        tokenID,
        price: parseFloat(price),
        size: parseFloat(size),
        side: side.toUpperCase(),
      },
      {
        tickSize,
        negRisk,
      }
    );

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error placing Polymarket order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to place order', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

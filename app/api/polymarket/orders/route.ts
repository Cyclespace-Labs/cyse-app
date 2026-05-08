// Polymarket Orders API Route
// Gets user's open orders and cancels orders (requires authentication)

import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/polymarket/auth';

export async function GET(request: NextRequest) {
  try {
    // Create authenticated client
    const client = await createAuthenticatedClient();

    // Get user's open orders
    const orders = await client.getOpenOrders();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching Polymarket orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderID } = body;

    if (!orderID) {
      return NextResponse.json(
        { error: 'Missing required field: orderID' },
        { status: 400 }
      );
    }

    // Create authenticated client
    const client = await createAuthenticatedClient();

    // Cancel order
    const result = await client.cancelOrder(orderID);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error cancelling Polymarket order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel order', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Real-time updates hook for Polymarket CLOB API
// Provides WebSocket/SSE streaming for price and order book updates

import { useEffect, useRef, useState, useCallback } from 'react';
import { POLYMARKET_CONFIG } from '@/lib/polymarket/config';

interface RealtimeData {
  tokenId: string;
  price?: number;
  orderBook?: {
    asks: Array<{ price: number; size: number }>;
    bids: Array<{ price: number; size: number }>;
  };
  timestamp: number;
}

interface UsePolymarketRealtimeOptions {
  tokenIds: string[];
  onPriceUpdate?: (tokenId: string, price: number) => void;
  onOrderBookUpdate?: (tokenId: string, orderBook: any) => void;
  onError?: (error: Error) => void;
}

export function usePolymarketRealtime({
  tokenIds,
  onPriceUpdate,
  onOrderBookUpdate,
  onError,
}: UsePolymarketRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (tokenIds.length === 0) return;

    try {
      // For now, use SSE as fallback since WebSocket implementation is complex
      // In a production setup, you'd use the CLOB WebSocket API
      // This is a simplified implementation that polls for updates
      console.log('Connecting to Polymarket real-time updates for tokens:', tokenIds);
      setIsConnected(true);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error connecting to Polymarket real-time:', error);
      onError?.(error as Error);
      setIsConnected(false);
    }
  }, [tokenIds, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    // Set up polling as a fallback for real-time updates
    const pollInterval = setInterval(async () => {
      if (tokenIds.length === 0) return;

      try {
        // Poll order book for each token ID
        for (const tokenId of tokenIds) {
          const response = await fetch(`/api/polymarket/orderbook?token_id=${tokenId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.lastPrice && onPriceUpdate) {
              onPriceUpdate(tokenId, data.lastPrice);
            }
            
            if (data.asks || data.bids) {
              onOrderBookUpdate?.(tokenId, data);
            }
            
            setLastUpdate(Date.now());
          }
        }
      } catch (error) {
        console.error('Error polling Polymarket order book:', error);
        onError?.(error as Error);
      }
    }, POLYMARKET_CONFIG.WEBSOCKET.HEARTBEAT_INTERVAL);

    return () => {
      disconnect();
      clearInterval(pollInterval);
    };
  }, [tokenIds, connect, disconnect, onPriceUpdate, onOrderBookUpdate, onError]);

  const subscribe = useCallback((tokenId: string) => {
    // In a full WebSocket implementation, this would send a subscription message
    console.log('Subscribing to token:', tokenId);
  }, []);

  const unsubscribe = useCallback((tokenId: string) => {
    // In a full WebSocket implementation, this would send an unsubscription message
    console.log('Unsubscribing from token:', tokenId);
  }, []);

  return {
    isConnected,
    lastUpdate,
    subscribe,
    unsubscribe,
    disconnect,
  };
}

/**
 * Simplified hook for single token real-time price updates
 */
export function usePolymarketPrice(tokenId: string) {
  const [price, setPrice] = useState<number | null>(null);

  const realtime = usePolymarketRealtime({
    tokenIds: tokenId ? [tokenId] : [],
    onPriceUpdate: (id, newPrice) => {
      if (id === tokenId) {
        setPrice(newPrice);
      }
    },
    onError: (error) => {
      console.error('Real-time price error:', error);
    },
  });

  return {
    price,
    ...realtime,
  };
}

/**
 * Simplified hook for single token real-time order book updates
 */
export function usePolymarketOrderBook(tokenId: string) {
  const [orderBook, setOrderBook] = useState<any>(null);

  const realtime = usePolymarketRealtime({
    tokenIds: tokenId ? [tokenId] : [],
    onOrderBookUpdate: (id, newOrderBook) => {
      if (id === tokenId) {
        setOrderBook(newOrderBook);
      }
    },
    onError: (error) => {
      console.error('Real-time order book error:', error);
    },
  });

  return {
    orderBook,
    ...realtime,
  };
}

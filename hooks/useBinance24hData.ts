import { useState, useEffect, useRef } from "react";

interface Binance24hData {
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  isLoading: boolean;
  error: Error | null;
}

interface BinanceTickerMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Average price
  c: string; // Last price
  Q: string; // Last quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade Id
  n: number; // Total number of trades
}

/**
 * Fetches 24h ticker data from Binance WebSocket API.
 *
 * WebSocket: wss://stream.binance.com:9443/ws/<symbol>@ticker
 * Example: wss://stream.binance.com:9443/ws/ethusdt@ticker
 * No API key required for public endpoints.
 *
 * Response fields:
 * - p: Price change in the last 24h
 * - P: Price change percentage in the last 24h
 * - h: Highest price in the last 24h
 * - l: Lowest price in the last 24h
 * - v: Base asset volume traded in the last 24h (ETH/BTC)
 * - q: Quote asset volume traded in the last 24h (USDT/USD)
 */
export function useBinance24hData(symbol: string): Binance24hData {
  const [data, setData] = useState<Binance24hData>({
    priceChange: 0,
    priceChangePercent: 0,
    highPrice: 0,
    lowPrice: 0,
    volume: 0,
    quoteVolume: 0,
    isLoading: true,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const currentSymbolRef = useRef(symbol);

  useEffect(() => {
    // Map symbol to Binance format (ETH -> ethusdt, BTC -> btcusdt) - lowercase for WebSocket
    const binanceSymbol = `${symbol.toLowerCase()}usdt`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@ticker`;

    console.log(`[Binance WS] Connecting to ${wsUrl}`);
    mountedRef.current = true;
    currentSymbolRef.current = symbol;

    // Reset state when symbol changes
    setData({
      priceChange: 0,
      priceChangePercent: 0,
      highPrice: 0,
      lowPrice: 0,
      volume: 0,
      quoteVolume: 0,
      isLoading: true,
      error: null,
    });

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      console.log(`[Binance WS] Connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const message: BinanceTickerMessage = JSON.parse(event.data);

        // Only process messages for the current symbol (Binance returns uppercase e.g., "ETHUSDT")
        if (message.e === "24hrTicker" && message.s === binanceSymbol.toUpperCase()) {
          const parsedData = {
            priceChange: parseFloat(message.p),
            priceChangePercent: parseFloat(message.P),
            highPrice: parseFloat(message.h),
            lowPrice: parseFloat(message.l),
            volume: parseFloat(message.v),
            quoteVolume: parseFloat(message.q),
            isLoading: false,
            error: null,
          };

          setData(parsedData);
        }
      } catch (error) {
        console.error("[Binance WS] Failed to parse message:", error);
      }
    };

    ws.onerror = (event) => {
      if (!mountedRef.current) return;
      console.error("[Binance WS] WebSocket error event:", event);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: new Error("WebSocket connection error"),
      }));
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      console.log(`[Binance WS] Disconnected for ${symbol}, code: ${event.code}, reason: ${event.reason}`);
    };

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [symbol]);

  return data;
}

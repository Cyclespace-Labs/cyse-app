"use client";

/**
 * Real-time Pyth price streaming via Hermes WebSocket API.
 *
 * Connects to: wss://hermes.pyth.network/ws and subscribes to feed IDs.
 * Receives incremental price updates as soon as they are published.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { HERMES_WS_URL, PYTH_FEED_IDS, feedIdToPair } from "@/lib/pyth/config";
import type {
  PythResolvedPrice,
  PythWebsocketMessage,
  PythWebsocketPriceFeed,
} from "@/types/trading";

const WS_MAX_RECONNECTS = 10;
const WS_RECONNECT_BASE = 1_000;
const WS_RECONNECT_MAX  = 30_000;

const normaliseId = (id: string) => (id.startsWith("0x") ? id : `0x${id}`);

function parsePythPrice(raw: { price: string; conf: string; expo: number }): {
  price: number;
  confidence: number;
} {
  const factor = Math.pow(10, raw.expo);
  return {
    price: Number(raw.price) * factor,
    confidence: Number(raw.conf) * factor,
  };
}

function resolvePrice(feed: PythWebsocketPriceFeed): PythResolvedPrice {
  const id = normaliseId(feed.id);
  const { price, confidence } = parsePythPrice(feed.price);
  const { price: emaPrice } = parsePythPrice(feed.ema_price);
  const pair = feedIdToPair(id) ?? id.slice(0, 10);

  return {
    pair,
    feedId: id,
    price,
    confidence,
    emaPrice,
    publishTime: feed.price.publish_time,
    priceRaw: feed.price.price,
    exponent: feed.price.expo,
    updateData: null,
  };
}

export interface UsePythPricesReturn {
  /** Map of "ETH/USD" → PythResolvedPrice */
  prices: Record<string, PythResolvedPrice>;
  /** Whether the WebSocket connection is currently open. */
  connected: boolean;
  /** Number of reconnection attempts so far. */
  reconnects: number;
  /** Last error message, if any. */
  error: string | null;
  /** Timestamp of the latest received event. */
  lastUpdate: number;
}

/**
 * Stream real-time prices from the Hermes WebSocket API.
 *
 * @param feedIds - Array of 0x-prefixed feed IDs to subscribe to.
 *                  Defaults to all feeds in PYTH_FEED_IDS.
 */
export function usePythPrices(feedIds?: string[]): UsePythPricesReturn {
  const ids = feedIds ?? Object.values(PYTH_FEED_IDS);

  const [prices, setPrices]         = useState<Record<string, PythResolvedPrice>>({});
  const [connected, setConnected]   = useState(false);
  const [reconnects, setReconnects] = useState(0);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const mountedRef   = useRef(false);

  const idsKey = useMemo(() => ids.map(normaliseId).sort().join(","), [ids]);

  useEffect(() => {
    const subscriptionIds = ids.map(normaliseId);
    if (!subscriptionIds.length) {
      setPrices({});
      setConnected(false);
      setLastUpdate(0);
      return () => undefined;
    }

    mountedRef.current = true;
    reconnectRef.current = 0;
    setReconnects(0);
    setError(null);

    const connect = () => {
      if (!mountedRef.current) return;

      const ws = new WebSocket(HERMES_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        setError(null);
        reconnectRef.current = 0;
        setReconnects(0);

        ws.send(
          JSON.stringify({
            type: "subscribe",
            ids: subscriptionIds,
            parsed: true,
          })
        );
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        let message: PythWebsocketMessage | null = null;
        try {
          message = JSON.parse(event.data) as PythWebsocketMessage;
        } catch {
          return;
        }

        if (!message) return;

        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        if (message.type === "error" || message.error || message.message === "error") {
          const errMsg =
            (typeof message.error === "string" && message.error) ||
            (typeof message.message === "string" && message.message) ||
            "Hermes websocket error";
          setError(errMsg);
          return;
        }

        const feeds: PythWebsocketPriceFeed[] = [];
        if (message.price_feed) feeds.push(message.price_feed);
        if (Array.isArray(message.price_feeds)) feeds.push(...message.price_feeds);

        if (!feeds.length) return;

        setPrices((prev) => {
          const next = { ...prev };
          for (const feed of feeds) {
            const resolved = resolvePrice(feed);
            next[resolved.pair] = resolved;
          }
          return next;
        });
        setLastUpdate(Date.now());
      };

      const scheduleReconnect = () => {
        if (!mountedRef.current) return;
        setConnected(false);

        if (reconnectRef.current < WS_MAX_RECONNECTS) {
          reconnectRef.current += 1;
          setReconnects(reconnectRef.current);
          const delay = Math.min(
            WS_RECONNECT_BASE * Math.pow(2, reconnectRef.current - 1),
            WS_RECONNECT_MAX
          );
          setTimeout(connect, delay);
        } else {
          setError(`WebSocket disconnected after ${WS_MAX_RECONNECTS} attempts`);
        }
      };

      ws.onerror = () => {
        scheduleReconnect();
        try {
          ws.close();
        } catch {
          /* noop */
        }
      };

      ws.onclose = () => {
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close();
        } catch {
          /* noop */
        }
      }
      wsRef.current = null;
    };
  }, [idsKey, ids]);

  return { prices, connected, reconnects, error, lastUpdate };
}

/**
 * Convenience hook: get a single Pyth feed price by pair name ("ETH/USD").
 */
export function usePythPrice(pair: string, allPrices: Record<string, PythResolvedPrice>): PythResolvedPrice | null {
  return allPrices[pair] ?? null;
}

export default usePythPrices;

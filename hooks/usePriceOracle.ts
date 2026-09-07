"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";
import { formatUnits } from "viem";
import type { Abi } from "viem";
import { HERMES_WS_URL, HERMES_BASE_URL, resolvePythFeed, PYTH_FEED_IDS, feedIdToPair } from "@/lib/pyth/config";
import type { PythWebsocketMessage, PythWebsocketPriceFeed, PythResolvedPrice } from "@/types/trading";

// ── Thresholds ──────────────────────────────────────────────────────────────
const PYTH_STALE_MS       = 10_000;  // 10 s without Pyth update → warn
const CHAIN_STALE_MS      = 60_000;  // 60 s without on-chain → warn
const ERROR_THRESHOLD_MS  = 120_000; // 2 min → error
const CHAIN_POLL_MS       = 5_000;   // on-chain poll (slower when WebSocket is healthy)
const CHAIN_POLL_FAST_MS  = 2_000;   // on-chain poll fallback when Pyth is down

const WS_MAX_RECONNECTS  = 10;
const WS_RECONNECT_BASE  = 1_000;
const WS_RECONNECT_MAX   = 30_000;

// ── Pyth price conversion ───────────────────────────────────────────────────
function parsePythRaw(raw: { price: string; conf: string; expo: number }): {
  price: number;
  confidence: number;
} {
  const factor = Math.pow(10, raw.expo);
  return { price: Number(raw.price) * factor, confidence: Number(raw.conf) * factor };
}

// ── Interfaces (unchanged for consumers) ────────────────────────────────────
export interface PriceOracleState {
  price: number | null;
  priceRaw: bigint | null;
  lastUpdate: number;
  source: "vault" | "pyth" | "websocket" | "stale" | "error";
  isValid: boolean;
  isStale: boolean;
  confidence: number;
  deviation: number;
  error?: string;
  networkStatus: "online" | "degraded" | "offline";
  websocketConnected: boolean;
}

export interface PriceValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  bounds: { min: number; max: number };
  acceptablePrice: bigint;
}

// ═════════════════════════════════════════════════════════════════════════════
// usePriceOracle — Pyth WebSocket stream as primary, VaultPriceFeed as on-chain
// validation / fallback. Replaces the old fast-price poller approach.
// ═════════════════════════════════════════════════════════════════════════════
export function usePriceOracle(indexToken: `0x${string}`, maximise = true) {
  // ── Pyth WebSocket state ─────────────────────────────────────────────────
  const [pythPrice, setPythPrice]          = useState<PythResolvedPrice | null>(null);
  const [pythConnected, setPythConnected]  = useState(false);
  const [pythLastUpdate, setPythLastUpdate] = useState(0);
  const wsRef         = useRef<WebSocket | null>(null);
  const reconnectRef  = useRef(0);
  const mountedRef    = useRef(true);
  const currentFeedRef = useRef<string | null>(null);

  // Resolve which Pyth feed ID this indexToken maps to
  const pythFeedPair = useMemo(() => {
    // Try address first, then common symbol lookup
    const pair = resolvePythFeed(indexToken);
    if (pair) return pair;
    // Fallback: if indexToken matches weth address → ETH/USD
    if (indexToken.toLowerCase() === contracts.weth.address.toLowerCase()) return "ETH/USD" as const;
    if (indexToken.toLowerCase() === contracts.btc.address.toLowerCase()) return "BTC/USD" as const;
    return null;
  }, [indexToken]);

  const pythFeedId = pythFeedPair ? PYTH_FEED_IDS[pythFeedPair] : null;

  // ── Pyth Hermes WebSocket connection (real-time updates) ────────────────
  useEffect(() => {
    if (!pythFeedId) return;
    mountedRef.current = true;
    currentFeedRef.current = pythFeedId;

    // Reset state when feed changes
    setPythPrice(null);
    setPythConnected(false);
    setPythLastUpdate(0);

    const connect = () => {
      if (!mountedRef.current) return;

      // Check if API key is available for authentication
      const apiKey = process.env.NEXT_PUBLIC_PYTH_API_KEY;
      if (!apiKey) {
        console.warn("[usePriceOracle] PYTH_API_KEY not set. Pyth Hermes API requires authentication as of August 26, 2026.");
        console.warn("[usePriceOracle] Get your free API key from: https://pyth.network/terminal");
        console.warn("[usePriceOracle] Add it to your .env file as: NEXT_PUBLIC_PYTH_API_KEY=your_key_here");
      }

      // Construct WebSocket URL - Pyth WebSocket uses different auth than HTTP
      // We'll try without auth first, then fall back to HTTP polling if needed
      const ws = new WebSocket(HERMES_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        ws.send(
          JSON.stringify({
            type: "subscribe",
            ids: [pythFeedId],
            parsed: true,
          })
        );
        setPythConnected(true);
        reconnectRef.current = 0;
        console.log("[usePriceOracle] Pyth WebSocket connected for", pythFeedPair);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        let payload: PythWebsocketMessage | null = null;
        try {
          payload = JSON.parse(event.data) as PythWebsocketMessage;
        } catch {
          return;
        }

        if (!payload) return;

        if (payload.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        const feeds: PythWebsocketPriceFeed[] = [];
        if (payload.price_feed) feeds.push(payload.price_feed);
        if (Array.isArray(payload.price_feeds)) feeds.push(...payload.price_feeds);

        if (!feeds.length) return;

        for (const feed of feeds) {
          const id = feed.id.startsWith("0x") ? feed.id : `0x${feed.id}`;
          const pair = feedIdToPair(id);
          // Only process messages for the current feed
          if (currentFeedRef.current === pythFeedId && pythFeedPair && pair === pythFeedPair) {
            const { price, confidence } = parsePythRaw(feed.price);
            const { price: emaPrice } = parsePythRaw(feed.ema_price);
            setPythPrice({
              pair: pythFeedPair,
              feedId: id,
              price,
              confidence,
              emaPrice,
              publishTime: feed.price.publish_time,
              priceRaw: feed.price.price,
              exponent: feed.price.exponent,
              updateData: null,
            });
            setPythLastUpdate(Date.now());
          }
        }
      };

      const scheduleReconnect = () => {
        if (!mountedRef.current) return;
        setPythConnected(false);

        if (reconnectRef.current < WS_MAX_RECONNECTS) {
          reconnectRef.current += 1;
          const delay = Math.min(
            WS_RECONNECT_BASE * Math.pow(2, reconnectRef.current - 1),
            WS_RECONNECT_MAX
          );
          console.log(
            `[usePriceOracle] Pyth WebSocket reconnecting in ${delay}ms (attempt ${reconnectRef.current})`
          );
          setTimeout(connect, delay);
        } else {
          console.error("[usePriceOracle] Pyth WebSocket max reconnects reached — falling back to on-chain");
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
      currentFeedRef.current = null;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close();
        } catch {
          /* noop */
        }
      }
      wsRef.current = null;
    };
  }, [pythFeedId, pythFeedPair]);

  // ── On-chain price: VaultPriceFeed (max + min in one batch) ───────────────
  // Slower polling when the WebSocket stream is healthy (5 s); faster fallback (2 s).
  const {
    data: priceResults,
    error: priceError,
    isLoading: chainLoading,
    refetch,
  } = useReadContracts({
    contracts: [
      {
        address:      contracts.vaultPriceFeed.address,
        abi:          contracts.vaultPriceFeed.abi as Abi,
        functionName: "getPrice" as const,
        args:         [indexToken, true,  true, false] as const,
      },
      {
        address:      contracts.vaultPriceFeed.address,
        abi:          contracts.vaultPriceFeed.abi as Abi,
        functionName: "getPrice" as const,
        args:         [indexToken, false, true, false] as const,
      },
    ],
    query: {
      refetchInterval: pythConnected ? CHAIN_POLL_MS : CHAIN_POLL_FAST_MS,
      staleTime:       CHAIN_POLL_FAST_MS - 500,
    },
  });

  const maxPriceRaw = priceResults?.[0]?.status === "success" ? (priceResults[0].result as bigint) : undefined;
  const minPriceRaw = priceResults?.[1]?.status === "success" ? (priceResults[1].result as bigint) : undefined;

  const maxPrice = maxPriceRaw ? parseFloat(formatUnits(maxPriceRaw, 30)) : null;
  const minPrice = minPriceRaw ? parseFloat(formatUnits(minPriceRaw, 30)) : null;

  const vaultMidPrice = (maxPrice !== null && minPrice !== null)
    ? (maxPrice + minPrice) / 2
    : (maxPrice ?? minPrice ?? null);

  const spread = (maxPrice !== null && minPrice !== null) ? Math.abs(maxPrice - minPrice) : 0;

  // priceRaw follows the maximise param for acceptable-price math in useTradingActions
  const vaultPriceRaw = maximise ? maxPriceRaw : minPriceRaw;

  // ── Timestamp tracking ────────────────────────────────────────────────────
  const [chainLastUpdate, setChainLastUpdate] = useState(Date.now());
  useEffect(() => {
    if (vaultPriceRaw) setChainLastUpdate(Date.now());
  }, [vaultPriceRaw]);

  const lastUpdate = Math.max(pythLastUpdate, chainLastUpdate);

  // ── Staleness & errors ────────────────────────────────────────────────────
  const now = Date.now();
  const pythStale   = pythConnected && (now - pythLastUpdate > PYTH_STALE_MS);
  const chainStale  = now - chainLastUpdate > CHAIN_STALE_MS;
  const hasRpcError = !!priceError ||
    (priceResults?.[0]?.status === "failure" && priceResults?.[1]?.status === "failure");
  const isError     = (hasRpcError && !pythPrice) || (now - lastUpdate > ERROR_THRESHOLD_MS);
  const isStale     = !isError && (pythStale || chainStale);

  // ── Price resolution: WebSocket Pyth stream → VaultPriceFeed fallback ─────
  const displayPrice  = pythPrice?.price ?? vaultMidPrice;
  const priceRawTyped = (vaultPriceRaw ?? null) as bigint | null;

  // Deviation between Pyth and on-chain (informational only — does NOT block trading)
  const deviation = useMemo(() => {
    if (!pythPrice?.price || !vaultMidPrice) return 0;
    return Math.abs((pythPrice.price - vaultMidPrice) / vaultMidPrice) * 100;
  }, [pythPrice?.price, vaultMidPrice]);

  // isValid: we have ANY non-zero price — Pyth OR on-chain
  const isValid = !isError && displayPrice !== null && displayPrice > 0;

  const source: PriceOracleState["source"] = isError
    ? "error"
    : isStale
    ? "stale"
    : pythConnected && pythPrice
    ? "websocket"
    : "vault";

  const networkStatus: PriceOracleState["networkStatus"] =
    isError ? "offline"
    : (hasRpcError && !pythConnected) ? "offline"
    : isStale ? "degraded"
    : "online";

  // Confidence: Pyth live > on-chain > stale > error
  const confidence = isError ? 0 : isStale ? 50 : pythConnected ? 98 : 85;

  // ── validatePrice ─────────────────────────────────────────────────────────
  const validatePrice = useCallback(
    (proposedPrice: number, slippageBps = 30): PriceValidationResult => {
      if (!isValid || displayPrice === null) {
        return {
          isValid: false,
          error:   priceError?.message ?? "Oracle price unavailable",
          bounds:  { min: 0, max: 0 },
          acceptablePrice: 0n,
        };
      }

      const slippageDec = slippageBps / 10_000;
      const minBound    = displayPrice * (1 - slippageDec);
      const maxBound    = displayPrice * (1 + slippageDec);

      if (proposedPrice < minBound || proposedPrice > maxBound) {
        return {
          isValid:  false,
          error:    `Price ${proposedPrice.toFixed(4)} outside range (${minBound.toFixed(4)} – ${maxBound.toFixed(4)})`,
          warning:  `Oracle: ${displayPrice.toFixed(4)}`,
          bounds:   { min: minBound, max: maxBound },
          acceptablePrice: 0n,
        };
      }

      return {
        isValid:         true,
        bounds:          { min: minBound, max: maxBound },
        acceptablePrice: priceRawTyped ?? 0n,
      };
    },
    [isValid, displayPrice, priceError, priceRawTyped]
  );

  // ── calculatePriceImpact ──────────────────────────────────────────────────
  const calculatePriceImpact = useCallback(
    (sizeUsd: number): { impact: number; warning?: string } => {
      if (!displayPrice || sizeUsd <= 0) return { impact: 0 };
      const typicalPoolDepth = 1_000_000;
      const impact = (sizeUsd / typicalPoolDepth) * 100;
      const warning = impact > 5
        ? `Very high price impact: ${impact.toFixed(2)}% – consider smaller size`
        : impact > 1
        ? `High price impact: ${impact.toFixed(2)}%`
        : undefined;
      return { impact, warning };
    },
    [displayPrice]
  );

  return {
    // Core prices
    price:               displayPrice,
    priceRaw:            priceRawTyped,
    maxPrice,
    minPrice,
    maxPriceRaw,
    minPriceRaw,
    spread,
    lastUpdate,
    // Oracle metadata
    source,
    isValid,
    isStale,
    confidence,
    deviation,
    error:               isError ? (priceError?.message ?? "Price data unavailable") : undefined,
    networkStatus,
    websocketConnected:  pythConnected,
    isLoading:           chainLoading && !displayPrice,
    // Functions
    validatePrice,
    calculatePriceImpact,
    refetch,
    // Pyth-specific (new)
    pythPrice,
    pythConnected,
    pythFeedPair,
    // Legacy compat
    mockPythPrice:          null,
    updateMockPythPrice:    async () => {},
  };
}

export default usePriceOracle;

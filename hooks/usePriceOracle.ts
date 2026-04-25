"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";
import { formatUnits } from "viem";
import type { Abi } from "viem";
import { HERMES_BASE_URL, resolvePythFeed, PYTH_FEED_IDS, feedIdToPair } from "@/lib/pyth/config";
import type { PythParsedFeed, PythStreamEvent, PythResolvedPrice } from "@/types/trading";

// ── Thresholds ──────────────────────────────────────────────────────────────
const PYTH_STALE_MS       = 10_000;  // 10 s without Pyth update → warn
const CHAIN_STALE_MS      = 60_000;  // 60 s without on-chain → warn
const ERROR_THRESHOLD_MS  = 120_000; // 2 min → error
const CHAIN_POLL_MS       = 5_000;   // on-chain poll (slower when Pyth SSE is active)
const CHAIN_POLL_FAST_MS  = 2_000;   // on-chain poll fallback when Pyth is down

const SSE_MAX_RECONNECTS  = 10;
const SSE_RECONNECT_BASE  = 1_000;
const SSE_RECONNECT_MAX   = 30_000;

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
// usePriceOracle — Pyth SSE (1 s) as primary, VaultPriceFeed as on-chain
// validation / fallback.  Replaces old WebSocket + FastPriceFeed logic.
// ═════════════════════════════════════════════════════════════════════════════
export function usePriceOracle(indexToken: `0x${string}`, maximise = true) {
  // ── Pyth SSE state ────────────────────────────────────────────────────────
  const [pythPrice, setPythPrice]          = useState<PythResolvedPrice | null>(null);
  const [pythConnected, setPythConnected]  = useState(false);
  const [pythLastUpdate, setPythLastUpdate] = useState(0);
  const esRef         = useRef<EventSource | null>(null);
  const reconnectRef  = useRef(0);
  const mountedRef    = useRef(true);

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

  // ── Pyth Hermes SSE connection (1-second real-time updates) ───────────────
  useEffect(() => {
    if (!pythFeedId) return;
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      const params = new URLSearchParams();
      params.append("ids[]", pythFeedId);
      params.set("parsed", "true");
      params.set("allow_unordered", "true");
      params.set("benchmarks_only", "false");

      const url = `${HERMES_BASE_URL}/v2/updates/price/stream?${params.toString()}`;
      console.log("[usePriceOracle] Pyth SSE connecting:", url);

      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;
        setPythConnected(true);
        reconnectRef.current = 0;
        console.log("[usePriceOracle] Pyth SSE connected for", pythFeedPair);
      };

      es.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data: PythStreamEvent = JSON.parse(event.data);
          if (!data.parsed?.length) return;

          const updateHex = data.binary?.data?.[0] ?? null;

          for (const feed of data.parsed) {
            const id = feed.id.startsWith("0x") ? feed.id : `0x${feed.id}`;
            const pair = feedIdToPair(id);
            if (pair !== pythFeedPair) continue;

            const { price, confidence } = parsePythRaw(feed.price);
            const { price: emaPrice } = parsePythRaw(feed.ema_price);

            setPythPrice({
              pair: pair ?? id,
              feedId: id,
              price,
              confidence,
              emaPrice,
              publishTime: feed.price.publish_time,
              priceRaw: feed.price.price,
              exponent: feed.price.expo,
              updateData: updateHex,
            });
            setPythLastUpdate(Date.now());
          }
        } catch { /* ignore malformed SSE */ }
      };

      es.onerror = () => {
        if (!mountedRef.current) return;
        setPythConnected(false);
        es.close();

        if (reconnectRef.current < SSE_MAX_RECONNECTS) {
          reconnectRef.current++;
          const delay = Math.min(SSE_RECONNECT_BASE * Math.pow(2, reconnectRef.current - 1), SSE_RECONNECT_MAX);
          console.log(`[usePriceOracle] Pyth SSE reconnecting in ${delay}ms (attempt ${reconnectRef.current})`);
          setTimeout(connect, delay);
        } else {
          console.error("[usePriceOracle] Pyth SSE max reconnects reached — falling back to on-chain");
        }
      };
    };

    connect();
    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [pythFeedId, pythFeedPair]);

  // ── On-chain price: VaultPriceFeed (max + min in one batch) ───────────────
  // Slower polling when Pyth SSE is active (5 s); faster fallback (2 s).
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

  // ── Price resolution: Pyth SSE → VaultPriceFeed fallback ──────────────────
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
    ? "pyth"
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
    websocketConnected:  pythConnected,  // Pyth SSE acts as the "websocket" layer
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

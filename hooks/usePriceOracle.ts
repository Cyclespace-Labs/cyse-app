"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useReadContract, useChainId } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";
import { formatUnits } from "viem";

const STALE_THRESHOLD_MS = 60_000; // 60 seconds = warning
const ERROR_THRESHOLD_MS = 300_000; // 5 minutes = error
const MAX_DEVIATION_PERCENT = 1; // 1% max deviation

// WebSocket configuration
const WEBSOCKET_RECONNECT_DELAY = 3000; // 3 seconds
const WEBSOCKET_MAX_RECONNECTS = 5;

export interface PriceOracleState {
  price: number | null;
  priceRaw: bigint | null;
  lastUpdate: number;
  source: "vault" | "pyth" | "websocket" | "stale" | "error";
  isValid: boolean;
  isStale: boolean;
  confidence: number; // 0-100, higher is better
  deviation: number; // % deviation from reference
  error?: string;
  networkStatus: "online" | "degraded" | "offline";
  websocketConnected: boolean;
}

export interface PriceValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  bounds: {
    min: number;
    max: number;
  };
  acceptablePrice: bigint; // For contract calls
}

export function usePriceOracle(indexToken: `0x${string}`, maximise = true) {
  const chainId = useChainId();
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [pythPrice, setPythPrice] = useState<number | null>(null);
  const [websocketPrice, setWebsocketPrice] = useState<number | null>(null);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"online" | "degraded" | "offline">("online");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // WebSocket connection for real-time price updates
  useEffect(() => {
    // WebSocket URL for price feeds (configure as needed)
    const wsUrl = process.env.NEXT_PUBLIC_PRICE_WEBSOCKET_URL;
    if (!wsUrl) {
      setNetworkStatus("degraded");
      return;
    }

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWebsocketConnected(true);
          setNetworkStatus("online");
          reconnectAttemptsRef.current = 0;
          // Subscribe to price feed for the token
          ws.send(JSON.stringify({
            type: "subscribe",
            token: indexToken,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "price" && data.token === indexToken) {
              setWebsocketPrice(data.price);
              setLastUpdate(Date.now());
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        ws.onerror = () => {
          setWebsocketConnected(false);
          setNetworkStatus("degraded");
        };

        ws.onclose = () => {
          setWebsocketConnected(false);
          // Attempt reconnection with backoff
          if (reconnectAttemptsRef.current < WEBSOCKET_MAX_RECONNECTS) {
            reconnectAttemptsRef.current++;
            setTimeout(connectWebSocket, WEBSOCKET_RECONNECT_DELAY * reconnectAttemptsRef.current);
          } else {
            setNetworkStatus("offline");
          }
        };
      } catch (e) {
        console.error("Failed to create WebSocket connection:", e);
        setNetworkStatus("offline");
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [indexToken]);

  // Primary price from VaultPriceFeed
  const {
    data: vaultPriceRaw,
    isLoading: vaultLoading,
    error: vaultError,
    refetch: refetchVault,
  } = useReadContract({
    ...contracts.vaultPriceFeed,
    functionName: "getPrice",
    args: [indexToken, maximise, true, false],
    query: {
      refetchInterval: websocketConnected ? 30_000 : 5_000, // Slower when WebSocket is active
      staleTime: 3_000,
    },
  });

  // Secondary price from FastPriceFeed if available
  const {
    data: fastPriceRaw,
    isLoading: fastLoading,
    error: fastError,
  } = useReadContract({
    ...contracts.fastPriceFeed,
    functionName: "getPrice",
    args: [indexToken, vaultPriceRaw || 0n, maximise], // refPrice from vault
    query: {
      refetchInterval: websocketConnected ? 30_000 : 3_000, // Slower when WebSocket is active
      staleTime: 2_000,
      enabled: !!contracts.fastPriceFeed.address,
    },
  });

  // Direct price from MockPyth for testing (if available)
  const { data: mockPythPriceData } = useReadContract({
    ...contracts.mockPyth,
    functionName: "getPrice",
    args: ["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"], // ETH price feed ID
    query: {
      refetchInterval: websocketConnected ? 30_000 : 5_000,
      staleTime: 3_000,
      enabled: !!contracts.mockPyth.address,
    },
  });

  // Convert MockPyth price to standard format
  const mockPythPrice = useMemo(() => {
    if (!mockPythPriceData) return null;
    const { price, expo } = mockPythPriceData;
    const priceNum = Number(price) / Math.pow(10, -expo);
    return priceNum;
  }, [mockPythPriceData]);

  // Get max price for validation (from vault)
  const { data: maxPriceRaw } = useReadContract({
    ...contracts.vault,
    functionName: "getMaxPrice",
    args: [indexToken],
    query: { refetchInterval: 10_000 },
  });

  // Get min price for validation
  const { data: minPriceRaw } = useReadContract({
    ...contracts.vault,
    functionName: "getMinPrice",
    args: [indexToken],
    query: { refetchInterval: 10_000 },
  });

  // Update timestamp when price changes
  useEffect(() => {
    if (vaultPriceRaw || websocketPrice) {
      setLastUpdate(Date.now());
    }
  }, [vaultPriceRaw, websocketPrice]);

  // Calculate staleness
  const now = Date.now();
  const timeSinceUpdate = now - lastUpdate;
  const isStale = timeSinceUpdate > STALE_THRESHOLD_MS;
  const isError = timeSinceUpdate > ERROR_THRESHOLD_MS || !!vaultError;

  // Format prices
  const vaultPrice = vaultPriceRaw ? parseFloat(formatUnits(vaultPriceRaw as bigint, 30)) : null;
  const fastPrice = fastPriceRaw ? parseFloat(formatUnits(fastPriceRaw as bigint, 30)) : null;
  const maxPrice = maxPriceRaw ? parseFloat(formatUnits(maxPriceRaw as bigint, 30)) : null;
  const minPrice = minPriceRaw ? parseFloat(formatUnits(minPriceRaw as bigint, 30)) : null;

  // Use WebSocket price if available and valid, otherwise fall back to vault
  const displayPrice = websocketPrice || vaultPrice;

  // Calculate deviation between sources
  const deviation = useMemo(() => {
    if (!vaultPrice || !fastPrice) return 0;
    return Math.abs((fastPrice - vaultPrice) / vaultPrice) * 100;
  }, [vaultPrice, fastPrice]);

  // Determine source and validity
  const priceRawTyped = (vaultPriceRaw ?? null) as bigint | null;
  const oracleState: PriceOracleState = useMemo(() => {
    if (isError) {
      return {
        price: displayPrice,
        priceRaw: priceRawTyped,
        lastUpdate,
        source: "error",
        isValid: false,
        isStale: true,
        confidence: 0,
        deviation,
        error: vaultError?.message || "Price data unavailable",
        networkStatus,
        websocketConnected,
      };
    }

    if (isStale) {
      return {
        price: displayPrice,
        priceRaw: priceRawTyped,
        lastUpdate,
        source: "stale",
        isValid: true, // Still usable but warn
        isStale: true,
        confidence: 50,
        deviation,
        networkStatus,
        websocketConnected,
      };
    }

    if (deviation > MAX_DEVIATION_PERCENT) {
      return {
        price: displayPrice,
        priceRaw: priceRawTyped,
        lastUpdate,
        source: "vault",
        isValid: false, // Reject due to high deviation
        isStale: false,
        confidence: 30,
        deviation,
        error: `Price deviation too high: ${deviation.toFixed(2)}%`,
        networkStatus,
        websocketConnected,
      };
    }

    return {
      price: displayPrice,
      priceRaw: priceRawTyped,
      lastUpdate,
      source: websocketConnected ? "websocket" : (mockPythPrice ? "pyth" : (fastPrice ? "pyth" : "vault")),
      isValid: true,
      isStale: false,
      confidence: websocketConnected ? 98 : (mockPythPrice ? 95 : (fastPrice ? 90 : 80)),
      deviation,
      networkStatus,
      websocketConnected,
    };
  }, [displayPrice, priceRawTyped, fastPrice, lastUpdate, isStale, isError, deviation, vaultError, networkStatus, websocketConnected]);

  // Validate a proposed price
  const validatePrice = useCallback(
    (proposedPrice: number, slippageBps: number = 30): PriceValidationResult => {
      if (!oracleState.isValid || !vaultPrice) {
        return {
          isValid: false,
          error: oracleState.error || "Oracle price unavailable",
          bounds: { min: 0, max: 0 },
          acceptablePrice: 0n,
        };
      }

      const slippageDecimal = slippageBps / 10000;
      const minPriceBound = vaultPrice * (1 - slippageDecimal);
      const maxPriceBound = vaultPrice * (1 + slippageDecimal);

      // Check if proposed price is within acceptable bounds
      if (proposedPrice < minPriceBound || proposedPrice > maxPriceBound) {
        return {
          isValid: false,
          error: `Price ${proposedPrice.toFixed(4)} outside acceptable range (${minPriceBound.toFixed(4)} - ${maxPriceBound.toFixed(4)})`,
          warning: `Current oracle price: ${vaultPrice.toFixed(4)}`,
          bounds: { min: minPriceBound, max: maxPriceBound },
          acceptablePrice: 0n,
        };
      }

      // Check against contract min/max prices
      if (minPrice && proposedPrice < minPrice * 0.99) {
        return {
          isValid: false,
          error: `Price below contract minimum: ${minPrice.toFixed(4)}`,
          bounds: { min: minPriceBound, max: maxPriceBound },
          acceptablePrice: 0n,
        };
      }

      if (maxPrice && proposedPrice > maxPrice * 1.01) {
        return {
          isValid: false,
          error: `Price above contract maximum: ${maxPrice.toFixed(4)}`,
          bounds: { min: minPriceBound, max: maxPriceBound },
          acceptablePrice: 0n,
        };
      }

      // Calculate acceptable price for contract (with slippage)
      // For longs: acceptablePrice = currentPrice * (1 + slippage)
      // For shorts: acceptablePrice = currentPrice * (1 - slippage)
      // Note: This is handled by the caller based on isLong
      const acceptablePrice = (vaultPriceRaw as bigint | undefined) ?? 0n;

      return {
        isValid: true,
        bounds: { min: minPriceBound, max: maxPriceBound },
        acceptablePrice,
      };
    },
    [oracleState, vaultPrice, vaultPriceRaw, minPrice, maxPrice]
  );

  // Calculate price impact for a given order size
  const calculatePriceImpact = useCallback(
    (sizeUsd: number): { impact: number; warning?: string } => {
      if (!vaultPrice || sizeUsd <= 0) return { impact: 0 };

      // Get pool depth (simplified - would use actual pool amounts)
      const typicalPoolDepth = 1_000_000; // $1M assumption
      const impact = (sizeUsd / typicalPoolDepth) * 100;

      let warning: string | undefined;
      if (impact > 1) warning = `High price impact: ${impact.toFixed(2)}%`;
      if (impact > 5) warning = `Very high price impact: ${impact.toFixed(2)}% - consider smaller size`;

      return { impact, warning };
    },
    [vaultPrice]
  );

  // Function to update MockPyth price for testing
  const updateMockPythPrice = useCallback(
    async (priceId: `0x${string}`, price: number, expo: number = 8): Promise<void> => {
      try {
        // Convert price to int64 (price * 10^expo)
        const priceInt = BigInt(Math.floor(price * Math.pow(10, expo)));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // This would need to use a write contract, for now just log
        console.log(`MockPyth price update: ID=${priceId}, Price=${price}, Expo=${expo}, Time=${currentTime}`);
        // TODO: Implement actual contract call when write functionality is added
      } catch (error) {
        console.error("Failed to update MockPyth price:", error);
        throw error;
      }
    },
    []
  );

  return {
    price: oracleState.price,
    priceRaw: oracleState.priceRaw as bigint | null,
    lastUpdate: oracleState.lastUpdate,
    source: oracleState.source,
    isValid: oracleState.isValid,
    isStale: oracleState.isStale,
    confidence: oracleState.confidence,
    deviation: oracleState.deviation,
    error: oracleState.error,
    maxPrice,
    minPrice,
    isLoading: vaultLoading || fastLoading,
    validatePrice,
    calculatePriceImpact,
    refetch: refetchVault,
    networkStatus: oracleState.networkStatus,
    websocketConnected: oracleState.websocketConnected,
    updateMockPythPrice,
    mockPythPrice,
  };
}

export default usePriceOracle;

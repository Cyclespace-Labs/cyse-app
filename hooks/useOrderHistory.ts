"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog, type Log } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import type { OrderHistoryEntry } from "@/types/trading";
import { useTransactionCache } from "./useTransactionCache";
import { getTokenSymbol } from "@/lib/protocol/contracts";

// Event ABIs for OrderBook
const CreateIncreaseOrderEvent = parseAbiItem([
  "event CreateIncreaseOrder(address indexed account, uint256 orderIndex, address purchaseToken, uint256 purchaseTokenAmount, address collateralToken, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee)"
]);

const CreateDecreaseOrderEvent = parseAbiItem([
  "event CreateDecreaseOrder(address indexed account, uint256 orderIndex, address collateralToken, uint256 collateralDelta, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee)"
]);

const CancelIncreaseOrderEvent = parseAbiItem([
  "event CancelIncreaseOrder(address indexed account, uint256 orderIndex, address purchaseToken, uint256 purchaseTokenAmount, address collateralToken, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee)"
]);

const CancelDecreaseOrderEvent = parseAbiItem([
  "event CancelDecreaseOrder(address indexed account, uint256 orderIndex, address collateralToken, uint256 collateralDelta, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee)"
]);

const ExecuteIncreaseOrderEvent = parseAbiItem([
  "event ExecuteIncreaseOrder(address indexed account, uint256 orderIndex, address purchaseToken, uint256 purchaseTokenAmount, address collateralToken, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee, uint256 executionPrice)"
]);

const ExecuteDecreaseOrderEvent = parseAbiItem([
  "event ExecuteDecreaseOrder(address indexed account, uint256 orderIndex, address collateralToken, uint256 collateralDelta, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee, uint256 executionPrice)"
]);

// Token address to symbol mapping helper
const getSymbolFromToken = (tokenAddress: string): string => {
  const symbol = getTokenSymbol(tokenAddress as `0x${string}`);
  return symbol || "UNKNOWN";
};

// Price formatting helper (30 decimals)
const formatPrice = (price: bigint): number => {
  return Number(price) / 1e30;
};

// Size formatting helper (30 decimals)
const formatSize = (size: bigint): number => {
  return Number(size) / 1e30;
};

const BLOCK_RANGE = 50000n; // Query 50k blocks at a time
const MAX_BLOCKS = 200000n; // Go back max 200k blocks

export function useOrderHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { mergeWithCache, getLastSyncedBlock, isReady } = useTransactionCache();
  
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderHistory = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = getLastSyncedBlock() > 0 
        ? BigInt(getLastSyncedBlock())
        : currentBlock > MAX_BLOCKS 
          ? currentBlock - MAX_BLOCKS 
          : 0n;

      const orderBookAddress = contracts.orderBook.address;
      const accountAddress = address.toLowerCase() as `0x${string}`;

      // Fetch all order events
      const eventFilters = [
        { event: CreateIncreaseOrderEvent, status: "created" as const },
        { event: CreateDecreaseOrderEvent, status: "created" as const },
        { event: CancelIncreaseOrderEvent, status: "cancelled" as const },
        { event: CancelDecreaseOrderEvent, status: "cancelled" as const },
        { event: ExecuteIncreaseOrderEvent, status: "executed" as const },
        { event: ExecuteDecreaseOrderEvent, status: "executed" as const },
      ];

      const allEvents: OrderHistoryEntry[] = [];

      for (const { event, status } of eventFilters) {
        // Fetch logs in chunks to avoid RPC limits
        let startBlock = fromBlock;
        
        while (startBlock <= currentBlock) {
          const endBlock = startBlock + BLOCK_RANGE > currentBlock 
            ? currentBlock 
            : startBlock + BLOCK_RANGE;

          try {
            const logs = await publicClient.getLogs({
              address: orderBookAddress,
              event,
              args: { account: accountAddress },
              fromBlock: startBlock,
              toBlock: endBlock,
            });

            for (const log of logs) {
              try {
                const decoded = decodeEventLog({
                  abi: [event],
                  data: log.data,
                  topics: log.topics,
                });

                const args = decoded.args as {
                  orderIndex: bigint;
                  collateralToken: `0x${string}`;
                  indexToken: `0x${string}`;
                  sizeDelta: bigint;
                  isLong: boolean;
                  triggerPrice: bigint;
                  triggerAboveThreshold: boolean;
                  executionFee: bigint;
                  purchaseToken?: `0x${string}`;
                  purchaseTokenAmount?: bigint;
                  collateralDelta?: bigint;
                  executionPrice?: bigint;
                };

                const isIncrease = event.name.includes("Increase");
                const symbol = getSymbolFromToken(args.indexToken);

                const entry: OrderHistoryEntry = {
                  id: `${log.transactionHash}-${args.orderIndex}`,
                  orderIndex: Number(args.orderIndex),
                  symbol,
                  side: (isIncrease && args.isLong) || (!isIncrease && !args.isLong) ? "buy" : "sell",
                  type: "limit", // Default, could be enhanced with more data
                  triggerPrice: formatPrice(args.triggerPrice),
                  sizeDelta: formatSize(args.sizeDelta),
                  collateralToken: args.collateralToken,
                  isLong: args.isLong,
                  status,
                  txHash: log.transactionHash || "",
                  blockNumber: Number(log.blockNumber),
                  timestamp: Date.now(), // Would need block timestamp for accuracy
                };

                allEvents.push(entry);
              } catch (decodeError) {
                console.warn("[useOrderHistory] Failed to decode log:", decodeError);
              }
            }
          } catch (fetchError) {
            console.warn("[useOrderHistory] Failed to fetch logs:", fetchError);
          }

          startBlock = endBlock + 1n;
        }
      }

      // Merge with cache and sort by block number
      const merged = mergeWithCache<OrderHistoryEntry>(
        "order",
        allEvents,
        (item) => item.id,
        (item) => item.blockNumber
      );

      setOrderHistory(merged);
    } catch (err) {
      console.error("[useOrderHistory] Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch order history");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, mergeWithCache, getLastSyncedBlock]);

  // Initial fetch
  useEffect(() => {
    if (isReady) {
      fetchOrderHistory();
    }
  }, [isReady, fetchOrderHistory]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  return {
    orderHistory,
    isLoading,
    error,
    refresh,
  };
}

export { CreateIncreaseOrderEvent, CreateDecreaseOrderEvent, CancelIncreaseOrderEvent, CancelDecreaseOrderEvent, ExecuteIncreaseOrderEvent, ExecuteDecreaseOrderEvent };

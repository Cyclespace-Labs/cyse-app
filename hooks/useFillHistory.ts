"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import type { FillHistoryEntry } from "@/types/trading";
import { useTransactionCache } from "./useTransactionCache";
import { resolveBlockTimestamps } from "@/lib/blockTimestamps";

// Event ABIs for executed orders
const ExecuteIncreaseOrderEvent = parseAbiItem([
  "event ExecuteIncreaseOrder(address indexed account, uint256 orderIndex, address purchaseToken, uint256 purchaseTokenAmount, address collateralToken, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee, uint256 executionPrice)"
]);

const ExecuteDecreaseOrderEvent = parseAbiItem([
  "event ExecuteDecreaseOrder(address indexed account, uint256 orderIndex, address collateralToken, uint256 collateralDelta, address indexToken, uint256 sizeDelta, bool isLong, uint256 triggerPrice, bool triggerAboveThreshold, uint256 executionFee, uint256 executionPrice)"
]);

// Token symbol helper
const getSymbolFromToken = (tokenAddress: string): string => {
  const tokenMap: Record<string, string> = {
    [contracts.weth.address.toLowerCase()]: "ETH",
    [contracts.btc.address.toLowerCase()]: "BTC",
    [contracts.usdc.address.toLowerCase()]: "USDC",
    [contracts.usdt.address.toLowerCase()]: "USDT",
    [contracts.usdg.address.toLowerCase()]: "USDG",
  };
  return tokenMap[tokenAddress.toLowerCase()] || "UNKNOWN";
};

// Format helpers (30 decimals)
const formatPrice = (price: bigint): number => Number(price) / 1e30;
const formatSize = (size: bigint): number => Number(size) / 1e30;
const formatFee = (fee: bigint): number => Number(fee) / 1e18; // Execution fee in 18 decimals

const BLOCK_RANGE = 50000n;
const MAX_BLOCKS = 200000n;

export function useFillHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { mergeWithCache, getHighWaterBlock, isReady } = useTransactionCache();
  const fetchingRef = useRef(false);

  const [fillHistory, setFillHistory] = useState<FillHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFillHistory = useCallback(async () => {
    if (!address || !publicClient || fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const hwb = getHighWaterBlock();
      const fromBlock = hwb > 0
        ? BigInt(hwb)
        : currentBlock > MAX_BLOCKS ? currentBlock - MAX_BLOCKS : 0n;

      const orderBookAddress = contracts.orderBook.address;
      const accountAddress = address.toLowerCase() as `0x${string}`;

      const eventFilters = [
        { event: ExecuteIncreaseOrderEvent, type: "increase" as const },
        { event: ExecuteDecreaseOrderEvent, type: "decrease" as const },
      ];

      const allEvents: FillHistoryEntry[] = [];

      for (const { event, type } of eventFilters) {
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
                  collateralDelta: bigint;
                  isLong: boolean;
                  triggerPrice: bigint;
                  triggerAboveThreshold: boolean;
                  executionFee: bigint;
                  executionPrice: bigint;
                  purchaseTokenAmount?: bigint;
                };

                const symbol = getSymbolFromToken(args.indexToken);
                const isIncrease = type === "increase";
                
                const entry: FillHistoryEntry = {
                  id: `${log.transactionHash}-${args.orderIndex}`,
                  orderIndex: Number(args.orderIndex),
                  symbol,
                  side: (isIncrease && args.isLong) || (!isIncrease && !args.isLong) ? "buy" : "sell",
                  type: args.triggerAboveThreshold ? "conditional" : "limit",
                  executionPrice: formatPrice(args.executionPrice),
                  sizeDelta: formatSize(args.sizeDelta),
                  collateralDelta: formatSize(args.collateralDelta ?? 0n),
                  fee: formatFee(args.executionFee),
                  txHash: log.transactionHash || "",
                  blockNumber: Number(log.blockNumber),
                  timestamp: 0, // resolved below
                };

                allEvents.push(entry);
              } catch (decodeError) {
                console.warn("[useFillHistory] Failed to decode log:", decodeError);
              }
            }
          } catch (fetchError) {
            console.warn("[useFillHistory] Failed to fetch logs:", fetchError);
          }

          startBlock = endBlock + 1n;
        }
      }

      // Resolve real block timestamps
      const tsMap = await resolveBlockTimestamps(publicClient, allEvents.map((e) => e.blockNumber));
      for (const e of allEvents) e.timestamp = tsMap.get(e.blockNumber) ?? Date.now();

      const merged = mergeWithCache<FillHistoryEntry>(
        "fill",
        allEvents,
        (item) => item.id,
        (item) => item.blockNumber,
        (item) => item.timestamp
      );

      setFillHistory(merged);
    } catch (err) {
      console.error("[useFillHistory] Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fill history");
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [address, publicClient, mergeWithCache, getHighWaterBlock]);

  // Initial fetch
  useEffect(() => {
    if (isReady) {
      fetchFillHistory();
    }
  }, [isReady, fetchFillHistory]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchFillHistory();
  }, [fetchFillHistory]);

  return {
    fillHistory,
    isLoading,
    error,
    refresh,
  };
}

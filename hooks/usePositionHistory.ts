"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog, type Log } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import type { PositionHistoryEntry } from "@/types/trading";
import { useTransactionCache } from "./useTransactionCache";

// Event ABIs for Vault - Position events
const IncreasePositionEvent = parseAbiItem([
  "event IncreasePosition(bytes32 key, address account, address collateralToken, address indexToken, uint256 collateralDelta, uint256 sizeDelta, bool isLong, uint256 price, uint256 fee)"
]);

const DecreasePositionEvent = parseAbiItem([
  "event DecreasePosition(bytes32 key, address account, address collateralToken, address indexToken, uint256 collateralDelta, uint256 sizeDelta, bool isLong, uint256 price, uint256 fee)"
]);

const ClosePositionEvent = parseAbiItem([
  "event ClosePosition(bytes32 key, address account, address collateralToken, address indexToken, uint256 collateralDelta, uint256 sizeDelta, bool isLong, uint256 price, uint256 fee)"
]);

const LiquidatePositionEvent = parseAbiItem([
  "event LiquidatePosition(bytes32 key, address account, address collateralToken, address indexToken, bool isLong, uint256 size, uint256 collateral, uint256 reserveAmount, int256 realisedPnl, uint256 markPrice)"
]);

// Token address to symbol mapping helper
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

// Price formatting helper (30 decimals)
const formatPrice = (price: bigint): number => {
  return Number(price) / 1e30;
};

// Size formatting helper (30 decimals)
const formatSize = (size: bigint): number => {
  return Number(size) / 1e30;
};

const BLOCK_RANGE = 50000n;
const MAX_BLOCKS = 200000n;

export function usePositionHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { mergeWithCache, getLastSyncedBlock, isReady } = useTransactionCache();
  
  const [positionHistory, setPositionHistory] = useState<PositionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositionHistory = useCallback(async () => {
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

      const vaultAddress = contracts.vault.address;
      const accountAddress = address.toLowerCase() as `0x${string}`;

      // Event filters
      const eventFilters = [
        { event: IncreasePositionEvent, action: "increase" as const },
        { event: DecreasePositionEvent, action: "decrease" as const },
        { event: ClosePositionEvent, action: "close" as const },
        { event: LiquidatePositionEvent, action: "liquidated" as const },
      ];

      const allEvents: PositionHistoryEntry[] = [];

      for (const { event, action } of eventFilters) {
        let startBlock = fromBlock;
        
        while (startBlock <= currentBlock) {
          const endBlock = startBlock + BLOCK_RANGE > currentBlock 
            ? currentBlock 
            : startBlock + BLOCK_RANGE;

          try {
            const logs = await publicClient.getLogs({
              address: vaultAddress,
              event,
              args: action === "liquidated" 
                ? { account: accountAddress }
                : { account: accountAddress },
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
                  key: `0x${string}`;
                  account: `0x${string}`;
                  collateralToken: `0x${string}`;
                  indexToken: `0x${string}`;
                  collateralDelta: bigint;
                  sizeDelta: bigint;
                  isLong: boolean;
                  price: bigint;
                  fee?: bigint;
                  realisedPnl?: bigint;
                  markPrice?: bigint;
                };

                const symbol = getSymbolFromToken(args.indexToken);
                const entryPrice = formatPrice(args.price);
                const sizeDelta = formatSize(args.sizeDelta);
                const collateralDelta = formatSize(args.collateralDelta);
                
                // Calculate PnL if available
                let pnl: number | undefined;
                if (args.realisedPnl !== undefined) {
                  pnl = Number(args.realisedPnl) / 1e30;
                }

                const entry: PositionHistoryEntry = {
                  id: `${log.transactionHash}-${log.logIndex}`,
                  symbol,
                  side: args.isLong ? "long" : "short",
                  action,
                  entryPrice,
                  exitPrice: action === "decrease" || action === "close" ? entryPrice : undefined,
                  sizeDelta,
                  collateralDelta,
                  pnl,
                  txHash: log.transactionHash || "",
                  blockNumber: Number(log.blockNumber),
                  timestamp: Date.now(),
                };

                allEvents.push(entry);
              } catch (decodeError) {
                console.warn("[usePositionHistory] Failed to decode log:", decodeError);
              }
            }
          } catch (fetchError) {
            console.warn("[usePositionHistory] Failed to fetch logs:", fetchError);
          }

          startBlock = endBlock + 1n;
        }
      }

      // Merge with cache and sort
      const merged = mergeWithCache<PositionHistoryEntry>(
        "position",
        allEvents,
        (item) => item.id,
        (item) => item.blockNumber
      );

      setPositionHistory(merged);
    } catch (err) {
      console.error("[usePositionHistory] Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch position history");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, mergeWithCache, getLastSyncedBlock]);

  // Initial fetch
  useEffect(() => {
    if (isReady) {
      fetchPositionHistory();
    }
  }, [isReady, fetchPositionHistory]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchPositionHistory();
  }, [fetchPositionHistory]);

  return {
    positionHistory,
    isLoading,
    error,
    refresh,
  };
}

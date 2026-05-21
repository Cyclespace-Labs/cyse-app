"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import type { SwapHistoryEntry } from "@/types/trading";
import { useTransactionCache } from "./useTransactionCache";
import { resolveBlockTimestamps } from "@/lib/blockTimestamps";

// Vault emits Swap(account, tokenIn, tokenOut, amountIn, amountOut, amountOutAfterFees, feeBasisPoints)
// account is NOT indexed — filter client-side after fetching
const VaultSwapEvent = parseAbiItem(
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 amountOutAfterFees, uint256 feeBasisPoints)"
);

const TOKEN_SYMBOLS: Record<string, string> = {
  [contracts.weth.address.toLowerCase()]: "ETH",
  [contracts.btc.address.toLowerCase()]:  "BTC",
  [contracts.usdc.address.toLowerCase()]: "USDC",
  [contracts.usdt.address.toLowerCase()]: "USDT",
  [contracts.usdg.address.toLowerCase()]: "USDG",
};

const TOKEN_DECIMALS: Record<string, number> = {
  [contracts.weth.address.toLowerCase()]: 18,
  [contracts.btc.address.toLowerCase()]:  8,
  [contracts.usdc.address.toLowerCase()]: 6,
  [contracts.usdt.address.toLowerCase()]: 6,
  [contracts.usdg.address.toLowerCase()]: 18,
};

function getSymbol(addr: string): string {
  return TOKEN_SYMBOLS[addr.toLowerCase()] ?? "UNKNOWN";
}

function formatAmount(raw: bigint, addr: string): number {
  const decimals = TOKEN_DECIMALS[addr.toLowerCase()] ?? 18;
  return Number(raw) / Math.pow(10, decimals);
}

const BLOCK_RANGE = 50_000n;
const MAX_BLOCKS  = 100_000n;

export function useSwapHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { mergeWithCache, getHighWaterBlock, isReady } = useTransactionCache();
  const fetchingRef = useRef(false);

  const [swapHistory, setSwapHistory] = useState<SwapHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSwapHistory = useCallback(async () => {
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

      const allEvents: SwapHistoryEntry[] = [];
      let startBlock = fromBlock;

      while (startBlock <= currentBlock) {
        const endBlock = startBlock + BLOCK_RANGE > currentBlock
          ? currentBlock
          : startBlock + BLOCK_RANGE;

        try {
          const logs = await publicClient.getLogs({
            address: contracts.vault.address,
            event: VaultSwapEvent,
            fromBlock: startBlock,
            toBlock: endBlock,
          });

          for (const log of logs) {
            try {
              const decoded = decodeEventLog({
                abi: [VaultSwapEvent],
                data: log.data,
                topics: log.topics,
              });

              const args = decoded.args as {
                account: `0x${string}`;
                tokenIn: `0x${string}`;
                tokenOut: `0x${string}`;
                amountIn: bigint;
                amountOut: bigint;
                amountOutAfterFees: bigint;
                feeBasisPoints: bigint;
              };

              // Filter to only this user's swaps (account not indexed)
              if (args.account.toLowerCase() !== address.toLowerCase()) continue;

              const entry: SwapHistoryEntry = {
                id: `${log.transactionHash}-${log.logIndex}`,
                tokenIn:        args.tokenIn,
                tokenOut:       args.tokenOut,
                symbolIn:       getSymbol(args.tokenIn),
                symbolOut:      getSymbol(args.tokenOut),
                amountIn:       formatAmount(args.amountIn, args.tokenIn),
                amountOut:      formatAmount(args.amountOutAfterFees, args.tokenOut),
                feeBasisPoints: Number(args.feeBasisPoints),
                txHash:         log.transactionHash ?? "",
                blockNumber:    Number(log.blockNumber),
                timestamp:      0,
              };

              allEvents.push(entry);
            } catch (decodeErr) {
              console.warn("[useSwapHistory] decode error:", decodeErr);
            }
          }
        } catch (fetchErr) {
          console.warn("[useSwapHistory] fetch error:", fetchErr);
        }

        startBlock = endBlock + 1n;
      }

      const tsMap = await resolveBlockTimestamps(publicClient, allEvents.map((e) => e.blockNumber));
      for (const e of allEvents) e.timestamp = tsMap.get(e.blockNumber) ?? Date.now();

      const merged = mergeWithCache<SwapHistoryEntry>(
        "swap",
        allEvents,
        (item) => item.id,
        (item) => item.blockNumber,
        (item) => item.timestamp
      );

      setSwapHistory(merged);
    } catch (err) {
      console.error("[useSwapHistory] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch swap history");
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [address, publicClient, mergeWithCache, getHighWaterBlock]);

  useEffect(() => {
    if (isReady) fetchSwapHistory();
  }, [isReady, fetchSwapHistory]);

  const refresh = useCallback(() => { fetchSwapHistory(); }, [fetchSwapHistory]);

  return { swapHistory, isLoading, error, refresh };
}

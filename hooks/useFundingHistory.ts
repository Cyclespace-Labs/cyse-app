"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import type { FundingHistoryEntry } from "@/types/trading";

// Funding events in Vault contract
const CollectMarginFeesEvent = parseAbiItem([
  "event CollectMarginFees(address token, uint256 feeUsd, uint256 feeTokens)"
]);

// Note: GMX-style funding is typically calculated off-chain and settled during trades
// We'll look for fee collection events and estimate funding

const BLOCK_RANGE = 50000n;
const MAX_BLOCKS = 100000n;

export function useFundingHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [fundingHistory, setFundingHistory] = useState<FundingHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchFundingHistory = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > MAX_BLOCKS 
        ? currentBlock - MAX_BLOCKS 
        : 0n;

      const vaultAddress = contracts.vault.address;
      
      // Check if the vault has margin fee collection events
      // These represent a form of funding/cost to traders
      let startBlock = fromBlock;
      const allEvents: FundingHistoryEntry[] = [];

      while (startBlock <= currentBlock) {
        const endBlock = startBlock + BLOCK_RANGE > currentBlock 
          ? currentBlock 
          : startBlock + BLOCK_RANGE;

        try {
          const logs = await publicClient.getLogs({
            address: vaultAddress,
            event: CollectMarginFeesEvent,
            fromBlock: startBlock,
            toBlock: endBlock,
          });

          // Funding fees are typically associated with positions
          // In GMX-style protocols, funding is implicit in the pricing
          // We'll create placeholder entries for now
          
          for (const log of logs.slice(0, 10)) { // Limit to avoid too much data
            try {
              const decoded = decodeEventLog({
                abi: [CollectMarginFeesEvent],
                data: log.data,
                topics: log.topics,
              });

              const args = decoded.args as {
                token: `0x${string}`;
                feeUsd: bigint;
                feeTokens: bigint;
              };

              // Map token to symbol
              const tokenMap: Record<string, string> = {
                [contracts.weth.address.toLowerCase()]: "ETH",
                [contracts.usdc.address.toLowerCase()]: "USDC",
                [contracts.usdt.address.toLowerCase()]: "USDT",
                [contracts.usdg.address.toLowerCase()]: "USDG",
              };
              const symbol = tokenMap[args.token.toLowerCase()] || "UNKNOWN";

              // This is actually a margin fee, not pure funding
              // In the future, we can enhance this with actual funding rate data
              const entry: FundingHistoryEntry = {
                id: `${log.transactionHash}-${log.logIndex}`,
                symbol,
                side: "long", // Default assumption
                fundingRate: 0.0001, // Placeholder 0.01%
                fundingFee: Number(args.feeUsd) / 1e30,
                timestamp: Date.now(),
                blockNumber: Number(log.blockNumber),
                txHash: log.transactionHash || "",
              };

              allEvents.push(entry);
            } catch (decodeError) {
              console.warn("[useFundingHistory] Failed to decode log:", decodeError);
            }
          }
        } catch (fetchError) {
          console.warn("[useFundingHistory] Failed to fetch logs:", fetchError);
          // Don't mark as unavailable on fetch error
        }

        startBlock = endBlock + 1n;
      }

      // For now, we'll show that funding data is available but limited
      // Real funding data requires tracking positions over time and calculating rate differences
      if (allEvents.length === 0) {
        setIsAvailable(false);
      }

      setFundingHistory(allEvents);
    } catch (err) {
      console.error("[useFundingHistory] Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch funding history");
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchFundingHistory();
    }
  }, [address, fetchFundingHistory]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchFundingHistory();
  }, [fetchFundingHistory]);

  return {
    fundingHistory,
    isLoading,
    error,
    isAvailable,
    refresh,
  };
}

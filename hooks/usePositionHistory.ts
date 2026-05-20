"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import type { PositionHistoryEntry } from "@/types/trading";
import { useTransactionCache } from "./useTransactionCache";
import { resolveBlockTimestamps } from "@/lib/blockTimestamps";

// ── Correct event ABIs from vault.abi.ts ─────────────────────────────────────
// IncreasePosition / DecreasePosition have: key, account, collateralToken,
//   indexToken, collateralDelta, sizeDelta, isLong, price, fee
// ClosePosition has NO account/indexToken/isLong → can't filter by user → omitted
// LiquidatePosition has: key, account, collateralToken, indexToken, isLong,
//   size, collateral, reserveAmount, realisedPnl, markPrice
//
// NOTE: account is NOT indexed in Vault events → getLogs args filter won't work.
// We fetch all events and filter client-side.

const IncreasePositionEvent = parseAbiItem([
  "event IncreasePosition(bytes32 key, address account, address collateralToken, address indexToken, uint256 collateralDelta, uint256 sizeDelta, bool isLong, uint256 price, uint256 fee)",
]);

const DecreasePositionEvent = parseAbiItem([
  "event DecreasePosition(bytes32 key, address account, address collateralToken, address indexToken, uint256 collateralDelta, uint256 sizeDelta, bool isLong, uint256 price, uint256 fee)",
]);

const LiquidatePositionEvent = parseAbiItem([
  "event LiquidatePosition(bytes32 key, address account, address collateralToken, address indexToken, bool isLong, uint256 size, uint256 collateral, uint256 reserveAmount, int256 realisedPnl, uint256 markPrice)",
]);

const getSymbolFromToken = (addr: string): string => {
  const m: Record<string, string> = {
    [contracts.weth.address.toLowerCase()]: "ETH",
    [contracts.btc.address.toLowerCase()]: "BTC",
    [contracts.usdc.address.toLowerCase()]: "USDC",
    [contracts.usdt.address.toLowerCase()]: "USDT",
    [contracts.usdg.address.toLowerCase()]: "USDG",
  };
  return m[addr.toLowerCase()] ?? "UNKNOWN";
};

const fmt30 = (v: bigint) => Number(v) / 1e30;

const BLOCK_RANGE = 50_000n;
const MAX_BLOCKS  = 200_000n;

export function usePositionHistory() {
  const { address }   = useAccount();
  const publicClient  = usePublicClient();
  const { mergeWithCache, getHighWaterBlock, isReady } = useTransactionCache();
  const fetchingRef   = useRef(false);

  const [positionHistory, setPositionHistory] = useState<PositionHistoryEntry[]>([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const fetchPositionHistory = useCallback(async () => {
    if (!address || !publicClient || fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const hwb       = getHighWaterBlock();
      const fromBlock = hwb > 0
        ? BigInt(hwb)
        : currentBlock > MAX_BLOCKS ? currentBlock - MAX_BLOCKS : 0n;

      const vaultAddress = contracts.vault.address;
      const lowerAddr    = address.toLowerCase();

      const eventDefs = [
        { event: IncreasePositionEvent, action: "increase" as const, isLiq: false },
        { event: DecreasePositionEvent, action: "decrease" as const, isLiq: false },
        { event: LiquidatePositionEvent, action: "liquidated" as const, isLiq: true },
      ];

      const allEvents: PositionHistoryEntry[] = [];

      for (const { event, action, isLiq } of eventDefs) {
        let startBlock = fromBlock;
        while (startBlock <= currentBlock) {
          const endBlock = startBlock + BLOCK_RANGE > currentBlock
            ? currentBlock : startBlock + BLOCK_RANGE;
          try {
            // No args filter — account is NOT indexed in Vault events
            const logs = await publicClient.getLogs({
              address: vaultAddress,
              event,
              fromBlock: startBlock,
              toBlock: endBlock,
            });

            for (const log of logs) {
              try {
                const decoded = decodeEventLog({ abi: [event], data: log.data, topics: log.topics });

                if (isLiq) {
                  const a = decoded.args as {
                    key: `0x${string}`; account: `0x${string}`;
                    collateralToken: `0x${string}`; indexToken: `0x${string}`;
                    isLong: boolean; size: bigint; collateral: bigint;
                    reserveAmount: bigint; realisedPnl: bigint; markPrice: bigint;
                  };
                  if (a.account.toLowerCase() !== lowerAddr) continue;
                  allEvents.push({
                    id: `${log.transactionHash}-${log.logIndex}`,
                    symbol: getSymbolFromToken(a.indexToken),
                    side: a.isLong ? "long" : "short",
                    action,
                    entryPrice: fmt30(a.markPrice),
                    exitPrice: fmt30(a.markPrice),
                    sizeDelta: fmt30(a.size),
                    collateralDelta: fmt30(a.collateral),
                    pnl: Number(a.realisedPnl) / 1e30,
                    txHash: log.transactionHash ?? "",
                    blockNumber: Number(log.blockNumber),
                    timestamp: 0,
                  });
                } else {
                  const a = decoded.args as {
                    key: `0x${string}`; account: `0x${string}`;
                    collateralToken: `0x${string}`; indexToken: `0x${string}`;
                    collateralDelta: bigint; sizeDelta: bigint;
                    isLong: boolean; price: bigint; fee: bigint;
                  };
                  if (a.account.toLowerCase() !== lowerAddr) continue;
                  const entryPrice = fmt30(a.price);
                  allEvents.push({
                    id: `${log.transactionHash}-${log.logIndex}`,
                    symbol: getSymbolFromToken(a.indexToken),
                    side: a.isLong ? "long" : "short",
                    action,
                    entryPrice,
                    exitPrice: action === "decrease" ? entryPrice : undefined,
                    sizeDelta: fmt30(a.sizeDelta),
                    collateralDelta: fmt30(a.collateralDelta),
                    pnl: undefined,
                    txHash: log.transactionHash ?? "",
                    blockNumber: Number(log.blockNumber),
                    timestamp: 0,
                  });
                }
              } catch {}
            }
          } catch {}
          startBlock = endBlock + 1n;
        }
      }

      // Resolve real block timestamps
      const tsMap = await resolveBlockTimestamps(publicClient, allEvents.map((e) => e.blockNumber));
      for (const e of allEvents) e.timestamp = tsMap.get(e.blockNumber) ?? Date.now();

      const merged = mergeWithCache<PositionHistoryEntry>(
        "position",
        allEvents,
        (e) => e.id,
        (e) => e.blockNumber,
        (e) => e.timestamp
      );

      setPositionHistory(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch position history");
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [address, publicClient, mergeWithCache, getHighWaterBlock]);

  useEffect(() => {
    if (isReady) fetchPositionHistory();
  }, [isReady, fetchPositionHistory]);

  const refresh = useCallback(() => fetchPositionHistory(), [fetchPositionHistory]);

  return { positionHistory, isLoading, error, refresh };
}

"use client";

import { useReadContracts, useAccount } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";
import { Position } from "@/types/trading";
import { useMemo } from "react";
import { formatUnits } from "viem";
import type { Abi } from "viem";

function fmt30(raw: bigint): number {
  return parseFloat(formatUnits(raw, 30));
}

// All valid (collateral, index, direction) combos the Vault can hold.
const COMBOS = [
  { collateral: contracts.weth.address, index: contracts.weth.address, symbol: "ETH", isLong: true },
  { collateral: contracts.usdc.address, index: contracts.weth.address, symbol: "ETH", isLong: true },
  { collateral: contracts.usdt.address, index: contracts.weth.address, symbol: "ETH", isLong: true },
  { collateral: contracts.usdc.address, index: contracts.weth.address, symbol: "ETH", isLong: false },
  { collateral: contracts.usdt.address, index: contracts.weth.address, symbol: "ETH", isLong: false },
  { collateral: contracts.btc.address,  index: contracts.btc.address,  symbol: "BTC", isLong: true },
  { collateral: contracts.weth.address, index: contracts.btc.address,  symbol: "BTC", isLong: true },
  { collateral: contracts.usdc.address, index: contracts.btc.address,  symbol: "BTC", isLong: true },
  { collateral: contracts.usdt.address, index: contracts.btc.address,  symbol: "BTC", isLong: true },
  { collateral: contracts.usdc.address, index: contracts.btc.address,  symbol: "BTC", isLong: false },
  { collateral: contracts.usdt.address, index: contracts.btc.address,  symbol: "BTC", isLong: false },
];

export function useAllPositions() {
  const { address } = useAccount();

  // ── Batch 1: getPosition for every combo ─────────────────────────────────
  const positionCalls = useMemo(
    () =>
      address
        ? COMBOS.map((c) => ({
            address: contracts.vault.address,
            abi: contracts.vault.abi as Abi,
            functionName: "getPosition" as const,
            args: [address, c.collateral, c.index, c.isLong],
          }))
        : [],
    [address]
  );

  const { data: posData, isLoading, refetch } = useReadContracts({
    contracts: positionCalls,
    query: { enabled: positionCalls.length > 0, refetchInterval: 2_000, staleTime: 500 },
  });

  // ── Identify non-zero positions so we only fetch deltas for those ────────
  const nonZeroIndices = useMemo(() => {
    if (!posData) return [];
    return posData
      .map((r, i) => {
        if (r.status !== "success" || !r.result) return -1;
        const raw = r.result as [bigint, ...unknown[]];
        return raw[0] > 0n ? i : -1;
      })
      .filter((i) => i >= 0);
  }, [posData]);

  // ── Batch 2: getPositionDelta only for non-zero positions ────────────────
  const deltaCalls = useMemo(
    () =>
      address
        ? nonZeroIndices.map((i) => ({
            address: contracts.vault.address,
            abi: contracts.vault.abi as Abi,
            functionName: "getPositionDelta" as const,
            args: [address, COMBOS[i].collateral, COMBOS[i].index, COMBOS[i].isLong],
          }))
        : [],
    [address, nonZeroIndices]
  );

  const { data: deltaData } = useReadContracts({
    contracts: deltaCalls,
    query: { enabled: deltaCalls.length > 0, refetchInterval: 2_000, staleTime: 500 },
  });

  // ── Build UI positions ───────────────────────────────────────────────────
  const positions = useMemo((): Position[] => {
    if (!posData) return [];
    return nonZeroIndices
      .map((comboIdx, deltaIdx) => {
        const result = posData[comboIdx];
        if (result.status !== "success" || !result.result) return null;
        const raw = result.result as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];
        const [size, collateral, averagePrice, , , , , lastIncreasedTime] = raw;
        if (size === 0n) return null;
        const combo = COMBOS[comboIdx];
        const sizeUsd = fmt30(size);
        const collateralUsd = fmt30(collateral);
        const avgPrice = fmt30(averagePrice);
        const leverage = collateralUsd > 0 ? sizeUsd / collateralUsd : 1;
        const liqDist = leverage > 0 ? avgPrice / leverage : 0;

        let pnl = 0;
        let pnlPct = 0;
        if (deltaData?.[deltaIdx]?.status === "success" && deltaData[deltaIdx].result) {
          const [hasProfit, delta] = deltaData[deltaIdx].result as [boolean, bigint];
          pnl = hasProfit ? fmt30(delta) : -fmt30(delta);
          pnlPct = collateralUsd > 0 ? (pnl / collateralUsd) * 100 : 0;
        }

        return {
          id: `${combo.symbol}-${combo.isLong ? "long" : "short"}-${combo.collateral.slice(0, 8)}`,
          symbol: `${combo.symbol}-PERP`,
          side: combo.isLong ? "long" : "short",
          entryPrice: avgPrice,
          quantity: sizeUsd,
          leverage: parseFloat(leverage.toFixed(2)),
          liquidationPrice: combo.isLong ? avgPrice - liqDist : avgPrice + liqDist,
          unrealizedPnl: pnl,
          unrealizedPnlPct: pnlPct,
          margin: collateralUsd,
          createdAt: Number(lastIncreasedTime),
        } as Position;
      })
      .filter(Boolean) as Position[];
  }, [posData, deltaData, nonZeroIndices]);

  return { positions, isLoading, refetch };
}

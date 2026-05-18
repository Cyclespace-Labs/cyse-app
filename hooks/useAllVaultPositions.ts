"use client";

import { useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";
import { formatUnits } from "viem";
import { useMemo } from "react";
import type { Abi } from "viem";

function formatAmount30(raw: bigint): number {
  return parseFloat(formatUnits(raw, 30));
}

export interface VaultPositionEntry {
  id: string;
  collateralToken: `0x${string}`;
  collateralKey: string;
  indexToken: `0x${string}`;
  indexKey: string;
  isLong: boolean;
  size: bigint;
  collateral: bigint;
  averagePrice: bigint;
  entryFundingRate: bigint;
  reserveAmount: bigint;
  realisedPnl: bigint;
  hasRealisedProfit: boolean;
  lastIncreasedTime: bigint;
  sizeUsd: number;
  collateralUsd: number;
  avgPriceFormatted: number;
  liquidationPrice: number;
}

// All valid (collateral, index, direction) combos the Vault can hold.
// The Vault keys positions by (account, collateralToken, indexToken, isLong).
// Shorts entered with WETH collateral are stored with USDC (Router swaps before Vault).
const POSITION_COMBOS: Array<{
  collateralToken: `0x${string}`;
  collateralKey: string;
  indexToken: `0x${string}`;
  indexKey: string;
  isLong: boolean;
}> = [
  // WETH/ETH index — longs
  { collateralToken: contracts.weth.address, collateralKey: "WETH", indexToken: contracts.weth.address, indexKey: "WETH", isLong: true },
  { collateralToken: contracts.usdc.address, collateralKey: "USDC", indexToken: contracts.weth.address, indexKey: "WETH", isLong: true },
  { collateralToken: contracts.usdt.address, collateralKey: "USDT", indexToken: contracts.weth.address, indexKey: "WETH", isLong: true },
  // WETH/ETH index — shorts (stable collateral only — WETH shorts are swapped to USDC by Router)
  { collateralToken: contracts.usdc.address, collateralKey: "USDC", indexToken: contracts.weth.address, indexKey: "WETH", isLong: false },
  { collateralToken: contracts.usdt.address, collateralKey: "USDT", indexToken: contracts.weth.address, indexKey: "WETH", isLong: false },
  // BTC index — longs
  { collateralToken: contracts.btc.address,  collateralKey: "BTC",  indexToken: contracts.btc.address,  indexKey: "BTC",  isLong: true },
  { collateralToken: contracts.weth.address, collateralKey: "WETH", indexToken: contracts.btc.address,  indexKey: "BTC",  isLong: true },
  { collateralToken: contracts.usdc.address, collateralKey: "USDC", indexToken: contracts.btc.address,  indexKey: "BTC",  isLong: true },
  { collateralToken: contracts.usdt.address, collateralKey: "USDT", indexToken: contracts.btc.address,  indexKey: "BTC",  isLong: true },
];

export function useAllVaultPositions(filterIndexToken?: `0x${string}`) {
  const { address } = useAccount();

  const combos = useMemo(
    () =>
      filterIndexToken
        ? POSITION_COMBOS.filter(
            (c) => c.indexToken.toLowerCase() === filterIndexToken.toLowerCase()
          )
        : POSITION_COMBOS,
    [filterIndexToken]
  );

  const positionContracts = useMemo(
    () =>
      address
        ? combos.map((combo) => ({
            address: contracts.vault.address,
            abi: contracts.vault.abi as Abi,
            functionName: "getPosition" as const,
            args: [address, combo.collateralToken, combo.indexToken, combo.isLong] as [
              `0x${string}`,
              `0x${string}`,
              `0x${string}`,
              boolean,
            ],
          }))
        : [],
    [address, combos]
  );

  const { data: positionData, isLoading, refetch } = useReadContracts({
    contracts: positionContracts,
    query: { enabled: positionContracts.length > 0, refetchInterval: 2_000, staleTime: 500 },
  });

  const positions = useMemo((): VaultPositionEntry[] => {
    if (!positionData) return [];
    return positionData
      .map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const raw = result.result as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];
        const [size, collateral, averagePrice, entryFundingRate, reserveAmount, realisedPnl, hasRealisedProfit, lastIncreasedTime] = raw;
        if (size === 0n) return null;
        const combo = combos[i];
        const avgPriceFormatted = formatAmount30(averagePrice);
        const sizeUsd = formatAmount30(size);
        const collateralUsd = formatAmount30(collateral);
        const leverage = collateralUsd > 0 ? sizeUsd / collateralUsd : 1;
        const liqDist = leverage > 0 ? avgPriceFormatted / leverage : 0;
        return {
          id: `${combo.collateralKey}-${combo.indexKey}-${combo.isLong ? "long" : "short"}`,
          collateralToken: combo.collateralToken,
          collateralKey: combo.collateralKey,
          indexToken: combo.indexToken,
          indexKey: combo.indexKey,
          isLong: combo.isLong,
          size,
          collateral,
          averagePrice,
          entryFundingRate,
          reserveAmount,
          realisedPnl,
          hasRealisedProfit,
          lastIncreasedTime,
          sizeUsd,
          collateralUsd,
          avgPriceFormatted,
          liquidationPrice: combo.isLong
            ? avgPriceFormatted - liqDist
            : avgPriceFormatted + liqDist,
        };
      })
      .filter(Boolean) as VaultPositionEntry[];
  }, [positionData, combos]);

  return { positions, isLoading, refetch };
}

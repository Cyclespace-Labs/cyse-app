"use client";

import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { contracts, PRICE_PRECISION } from "@/lib/protocol/contracts";
import { VaultPosition } from "@/types/protocol";
import { formatUnits } from "viem";

interface UseVaultPositionParams {
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  isLong: boolean;
}

function formatPrice(raw: bigint): number {
  return parseFloat(formatUnits(raw, 30));
}

function formatAmount(raw: bigint, decimals = 30): number {
  return parseFloat(formatUnits(raw, decimals));
}

export function useVaultPosition({ collateralToken, indexToken, isLong }: UseVaultPositionParams) {
  const { address } = useAccount();

  const { data: positionData, isLoading, refetch } = useReadContract({
    ...contracts.vault,
    functionName: "getPosition",
    args: address ? [address, collateralToken, indexToken, isLong] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const positionExists =
    !!positionData &&
    (positionData as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint])[0] > 0n;

  const { data: deltaData } = useReadContract({
    ...contracts.vault,
    functionName: "getPositionDelta",
    args: address ? [address, collateralToken, indexToken, isLong] : undefined,
    query: { enabled: !!address && positionExists, refetchInterval: 5_000 },
  });

  if (!positionData) return { position: null, isLoading, refetch };

  const [size, collateral, averagePrice, entryFundingRate, reserveAmount, realisedPnl, hasRealisedProfit, lastIncreasedTime] =
    positionData as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];

  if (size === 0n) return { position: null, isLoading, refetch };

  const [hasProfit, delta] = deltaData
    ? (deltaData as [boolean, bigint])
    : [false, 0n];

  const position: VaultPosition & {
    sizeUsd: number;
    collateralUsd: number;
    avgPriceFormatted: number;
    unrealizedPnlUsd: number;
    unrealizedPnlPct: number;
    liquidationPrice: number;
  } = {
    size,
    collateral,
    averagePrice,
    entryFundingRate,
    reserveAmount,
    realisedPnl,
    hasRealisedProfit,
    lastIncreasedTime,
    hasProfit,
    delta,
    sizeUsd: formatAmount(size),
    collateralUsd: formatAmount(collateral),
    avgPriceFormatted: formatPrice(averagePrice),
    unrealizedPnlUsd: hasProfit
      ? formatAmount(delta)
      : -formatAmount(delta),
    unrealizedPnlPct: collateral > 0n
      ? ((hasProfit ? formatAmount(delta) : -formatAmount(delta)) / formatAmount(collateral)) * 100
      : 0,
    liquidationPrice: (() => {
      const avgPriceNum = Number(averagePrice);
      const leverage = avgPriceNum > 0 && Number(collateral) > 0
        ? Number(size) / Number(collateral)
        : 1;
      const liqDist = avgPriceNum / leverage;
      return isLong
        ? formatPrice(averagePrice) - formatPrice(BigInt(Math.floor(liqDist)))
        : formatPrice(averagePrice) + formatPrice(BigInt(Math.floor(liqDist)));
    })(),
  };

  return { position, isLoading, refetch };
}

export function useIndexPrice(indexToken: `0x${string}`, maximise = true) {
  const { data: price, isLoading } = useReadContract({
    ...contracts.vaultPriceFeed,
    functionName: "getPrice",
    args: [indexToken, maximise, true, false],
    query: { refetchInterval: 5_000 },
  });

  return {
    price: price ? formatPrice(price as bigint) : null,
    priceRaw: (price as bigint) ?? null,
    isLoading,
  };
}

export { PRICE_PRECISION, formatAmount, formatPrice };

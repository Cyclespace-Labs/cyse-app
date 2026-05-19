"use client";

import { useMemo } from "react";
import { VaultPosition } from "@/types/protocol";
import { calculatePositionHealth, PositionValidationInput } from "@/lib/validation/trading";
import { useVaultConfig } from "./useVaultConfig";

interface PositionWithSide extends VaultPosition {
  isLong: boolean;
  sizeUsd: number;
  collateralUsd: number;
  avgPriceFormatted: number;
}

interface UsePositionHealthParams {
  position: PositionWithSide | null;
  currentPrice: number | null;
}

export function usePositionHealth({ position, currentPrice }: UsePositionHealthParams) {
  const { maxLeverage, liquidationFeeUsd, marginFeeBasisPoints } = useVaultConfig();

  const health = useMemo(() => {
    if (!position) {
      return {
        healthScore: 0,
        liquidationPrice: null,
        liquidationDistance: null,
        pnl: 0,
        pnlPercent: 0,
        status: "safe" as const,
        isLoading: false,
      };
    }

    const input: PositionValidationInput = {
      size: position.sizeUsd,
      collateral: position.collateralUsd,
      averagePrice: position.avgPriceFormatted,
      isLong: position.isLong,
      currentPrice,
      maxLeverage,
      liquidationFee: liquidationFeeUsd,
      marginFeeBps: marginFeeBasisPoints,
    };

    return calculatePositionHealth(input);
  }, [position, currentPrice, maxLeverage, liquidationFeeUsd, marginFeeBasisPoints]);

  // Additional derived metrics
  const metrics = useMemo(() => {
    if (!position) return null;

    const leverage = position.sizeUsd / position.collateralUsd;
    const marginRatio = (position.collateralUsd / position.sizeUsd) * 100;

    return {
      leverage,
      marginRatio,
      // Distance from liquidation as percentage of margin
      safetyBuffer: health.liquidationDistance
        ? health.liquidationDistance / marginRatio
        : null,
    };
  }, [position, health.liquidationDistance]);

  return {
    ...health,
    metrics,
    isHealthy: health.status === "safe",
    isWarning: health.status === "warning",
    isDanger: health.status === "danger" || health.status === "liquidated",
  };
}

export default usePositionHealth;

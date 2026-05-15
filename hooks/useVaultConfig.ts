"use client";

import { useReadContract } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";

export interface VaultConfigResult {
  maxLeverage: number;
  liquidationFeeUsd: number;
  isLoading: boolean;
}

/**
 * Reads the Vault's configuration parameters.
 * - maxLeverage: stored as basis points (e.g., 500000 = 50x leverage)
 * - liquidationFeeUsd: fixed USD fee for liquidations (e.g., 5 USD)
 */
export function useVaultConfig(): VaultConfigResult {
  const { data: maxLeverageRaw, isLoading: maxLeverageLoading } = useReadContract({
    ...contracts.vault,
    functionName: "maxLeverage",
    query: { staleTime: 60_000 },
  });

  const { data: liquidationFeeRaw, isLoading: liquidationFeeLoading } = useReadContract({
    ...contracts.vault,
    functionName: "liquidationFeeUsd",
    query: { staleTime: 60_000 },
  });

  // Vault maxLeverage is stored as basis points (e.g., 500000 = 50x)
  // Convert to decimal: maxLeverage / 10000
  const maxLeverage = maxLeverageRaw ? Number(maxLeverageRaw) / 10000 : 50;

  // liquidationFeeUsd is stored as a USD value with 30 decimals
  // Convert to decimal: liquidationFeeUsd / 10^30
  const liquidationFeeUsd = liquidationFeeRaw ? Number(liquidationFeeRaw) / 1e30 : 5;

  return {
    maxLeverage,
    liquidationFeeUsd,
    isLoading: maxLeverageLoading || liquidationFeeLoading,
  };
}

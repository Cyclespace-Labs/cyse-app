import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { contracts, FUNDING_RATE_PRECISION } from "@/lib/protocol/contracts";

interface VaultMarketData {
  openInterest: number;
  fundingRate: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches real Open Interest and Funding Rate from the Vault contract.
 * 
 * Open Interest = globalShortSizes + guaranteedUsd (standard GMX-style calculation)
 * Funding Rate = getNextFundingRate(token) / FUNDING_RATE_PRECISION
 */
export function useVaultMarketData(indexToken: `0x${string}`): VaultMarketData {
  // Fetch global short sizes for the token
  const { data: globalShortSizes, isLoading: isLoadingShortSizes } = useReadContract({
    ...contracts.vault,
    functionName: "globalShortSizes",
    args: [indexToken],
    query: {
      refetchInterval: 15_000, // Refetch every 15 seconds
    },
  });

  // Fetch guaranteed USD for the token
  const { data: guaranteedUsd, isLoading: isLoadingGuaranteed } = useReadContract({
    ...contracts.vault,
    functionName: "guaranteedUsd",
    args: [indexToken],
    query: {
      refetchInterval: 15_000,
    },
  });

  // Fetch next funding rate for the token
  const { data: nextFundingRate, isLoading: isLoadingFunding } = useReadContract({
    ...contracts.vault,
    functionName: "getNextFundingRate",
    args: [indexToken],
    query: {
      refetchInterval: 15_000,
    },
  });

  const isLoading = isLoadingShortSizes || isLoadingGuaranteed || isLoadingFunding;

  // Calculate Open Interest: globalShortSizes + guaranteedUsd (both in 30 decimals)
  const openInterest =
    globalShortSizes && guaranteedUsd
      ? parseFloat(formatUnits((globalShortSizes as bigint) + (guaranteedUsd as bigint), 30))
      : 0;

  // Calculate Funding Rate: nextFundingRate / FUNDING_RATE_PRECISION (1e6)
  const fundingRate =
    nextFundingRate
      ? (parseFloat(formatUnits(nextFundingRate as bigint, 0)) / parseFloat(formatUnits(FUNDING_RATE_PRECISION, 0))) * 100
      : 0;

  return {
    openInterest,
    fundingRate,
    isLoading,
    error: null,
  };
}

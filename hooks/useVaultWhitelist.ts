"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useMemo } from "react";
import { contracts } from "@/lib/protocol/contracts";

export interface VaultWhitelistResult {
  whitelistedAddresses: Set<string>;
  tokenCount: number;
  isLoading: boolean;
}

export function useVaultWhitelist(): VaultWhitelistResult {
  const { data: lengthRaw, isLoading: lengthLoading } = useReadContract({
    ...contracts.vault,
    functionName: "allWhitelistedTokensLength",
    query: { staleTime: 30_000 },
  });

  const tokenCount = lengthRaw ? Number(lengthRaw as bigint) : 0;

  const tokenCalls = useMemo(
    () =>
      Array.from({ length: tokenCount }, (_, i) => ({
        ...contracts.vault,
        functionName: "allWhitelistedTokens" as const,
        args: [BigInt(i)] as const,
      })),
    [tokenCount]
  );

  const { data: tokenResults, isLoading: tokensLoading } = useReadContracts({
    contracts: tokenCalls,
    query: { enabled: tokenCount > 0, staleTime: 30_000 },
  });

  const whitelistedAddresses = useMemo<Set<string>>(() => {
    if (!tokenResults) return new Set();
    return new Set(
      tokenResults
        .filter((r) => r.status === "success" && r.result)
        .map((r) => (r.result as string).toLowerCase())
    );
  }, [tokenResults]);

  return {
    whitelistedAddresses,
    tokenCount,
    isLoading: lengthLoading || tokensLoading,
  };
}

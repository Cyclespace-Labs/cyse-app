"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { contracts, PRICE_PRECISION } from "@/lib/protocol/contracts";
import { useVaultWhitelist } from "./useVaultWhitelist";

export interface VaultTokenPool {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  poolAmount: bigint;
  poolAmountFormatted: number;
  usdgAmount: bigint;
  reservedAmount: bigint;
  guaranteedUsd: bigint;
  minPrice: bigint;
  maxPrice: bigint;
  poolValueUsd: number;
  utilization: number;
  availableLiquidity: number;
}

const TOKEN_META: Record<string, { symbol: string; decimals: number; color: string }> = {
  [contracts.weth.address.toLowerCase()]: { symbol: "ETH", decimals: 18, color: "#627eea" },
  [contracts.btc.address.toLowerCase()]:  { symbol: "BTC", decimals: 18, color: "#f7931a" },
  [contracts.usdc.address.toLowerCase()]: { symbol: "USDC", decimals: 18, color: "#2775ca" },
  [contracts.usdt.address.toLowerCase()]: { symbol: "USDT", decimals: 18, color: "#26a17b" },
};

export function useVaultPoolData() {
  const { whitelistedAddresses, isLoading: whitelistLoading } = useVaultWhitelist();

  const tokenAddresses = useMemo(
    () => Array.from(whitelistedAddresses) as `0x${string}`[],
    [whitelistedAddresses]
  );

  const vaultCalls = useMemo(() => {
    if (tokenAddresses.length === 0) return [];
    return tokenAddresses.flatMap((addr) => [
      { ...contracts.vault, functionName: "poolAmounts" as const, args: [addr] as const },
      { ...contracts.vault, functionName: "usdgAmounts" as const, args: [addr] as const },
      { ...contracts.vault, functionName: "reservedAmounts" as const, args: [addr] as const },
      { ...contracts.vault, functionName: "guaranteedUsd" as const, args: [addr] as const },
      { ...contracts.vault, functionName: "getMinPrice" as const, args: [addr] as const },
      { ...contracts.vault, functionName: "getMaxPrice" as const, args: [addr] as const },
    ]);
  }, [tokenAddresses]);

  const { data: results, isLoading: poolLoading, refetch } = useReadContracts({
    contracts: vaultCalls,
    query: { enabled: vaultCalls.length > 0, refetchInterval: 10_000 },
  });

  const pools = useMemo<VaultTokenPool[]>(() => {
    if (!results || results.length === 0) return [];

    const FIELDS_PER_TOKEN = 6;
    return tokenAddresses.map((addr, i) => {
      const base = i * FIELDS_PER_TOKEN;
      const get = (offset: number) =>
        results[base + offset]?.status === "success"
          ? (results[base + offset].result as bigint)
          : 0n;

      const poolAmount = get(0);
      const usdgAmount = get(1);
      const reservedAmount = get(2);
      const guaranteedUsd = get(3);
      const minPrice = get(4);
      const maxPrice = get(5);

      const meta = TOKEN_META[addr.toLowerCase()] ?? { symbol: "???", decimals: 18, color: "#888" };

      const poolAmountFloat = parseFloat(formatUnits(poolAmount, meta.decimals));
      const midPrice = (minPrice + maxPrice) / 2n;
      const poolValueUsd =
        midPrice > 0n
          ? parseFloat(formatUnits((poolAmount * midPrice) / PRICE_PRECISION, meta.decimals))
          : 0;

      const utilization =
        poolAmount > 0n ? Number((reservedAmount * 10000n) / poolAmount) / 100 : 0;

      const availableLiquidity =
        poolAmount > reservedAmount
          ? parseFloat(formatUnits(poolAmount - reservedAmount, meta.decimals))
          : 0;

      return {
        address: addr,
        symbol: meta.symbol,
        decimals: meta.decimals,
        poolAmount,
        poolAmountFormatted: poolAmountFloat,
        usdgAmount,
        reservedAmount,
        guaranteedUsd,
        minPrice,
        maxPrice,
        poolValueUsd,
        utilization,
        availableLiquidity,
      };
    });
  }, [results, tokenAddresses]);

  const totalTvlUsd = useMemo(
    () => pools.reduce((sum, p) => sum + p.poolValueUsd, 0),
    [pools]
  );

  return {
    pools,
    totalTvlUsd,
    tokenMeta: TOKEN_META,
    isLoading: whitelistLoading || poolLoading,
    refetch,
  };
}

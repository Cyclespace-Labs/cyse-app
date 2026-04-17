"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { contracts } from "@/lib/protocol/contracts";

export interface StakingData {
  // CYSE token
  cyseBalance: number;
  cyseBalanceRaw: bigint;

  // Staked CYSE (in StakedCyseTracker)
  stakedCyseAmount: number;
  stakedCyseAmountRaw: bigint;

  // Bonus CYSE tracker
  bonusCyseAmount: number;

  // Fee CYSE tracker (earns WETH fees)
  feeCyseStaked: number;
  feeCyseClaimable: number;
  feeCyseClaimableRaw: bigint;

  // esCYSE claimable from StakedCyseTracker
  esCyseClaimable: number;
  esCyseClaimableRaw: bigint;

  // CYLP (vault LP token)
  cylpBalance: number;
  cylpBalanceRaw: bigint;

  // Staked CYLP
  stakedCylpAmount: number;
  stakedCylpAmountRaw: bigint;

  // Fee CYLP tracker (earns WETH fees)
  feeCylpClaimable: number;
  feeCylpClaimableRaw: bigint;

  // CYLP supply / price
  cylpSupply: number;
  cylpSupplyRaw: bigint;

  // Totals
  totalStakedValueUsd: number;
  totalClaimableEth: number;
  totalClaimableEsCyse: number;

  isLoading: boolean;
}

const ZERO = 0n;
const fmt = (v: bigint | undefined, d = 18) =>
  v ? parseFloat(formatUnits(v, d)) : 0;

export function useStakingData(): StakingData {
  const { address } = useAccount();

  // ── Batch read: balances, staked amounts, claimable ──────────────
  const calls = useMemo(() => {
    if (!address) return [];
    return [
      // 0: CYSE balance
      { ...contracts.cyse, functionName: "balanceOf" as const, args: [address] as const },
      // 1: stakedCyseTracker.stakedAmounts(user)
      { ...contracts.stakedCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 2: bonusCyseTracker.stakedAmounts(user)
      { ...contracts.bonusCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 3: feeCyseTracker.stakedAmounts(user)
      { ...contracts.feeCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 4: feeCyseTracker.claimable(user) — WETH fees
      { ...contracts.feeCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 5: stakedCyseTracker.claimable(user) — esCYSE
      { ...contracts.stakedCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 6: CYLP balance
      { ...contracts.cylp, functionName: "balanceOf" as const, args: [address] as const },
      // 7: stakedCylpTracker.stakedAmounts(user)
      { ...contracts.stakedCylpTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 8: feeCylpTracker.claimable(user) — WETH fees
      { ...contracts.feeCylpTracker, functionName: "claimable" as const, args: [address] as const },
      // 9: CYLP totalSupply
      { ...contracts.cylp, functionName: "totalSupply" as const },
      // 10: stakedCylpTracker.claimable(user) — esCYSE from CYLP staking
      { ...contracts.stakedCylpTracker, functionName: "claimable" as const, args: [address] as const },
    ];
  }, [address]);

  const { data, isLoading } = useReadContracts({
    contracts: calls,
    query: { enabled: calls.length > 0, refetchInterval: 8_000 },
  });

  return useMemo(() => {
    const get = (i: number): bigint =>
      data && data[i]?.status === "success" ? (data[i].result as bigint) : ZERO;

    const cyseBalanceRaw = get(0);
    const stakedCyseAmountRaw = get(1);
    const bonusCyseRaw = get(2);
    const feeCyseStakedRaw = get(3);
    const feeCyseClaimableRaw = get(4);
    const esCyseClaimableRaw = get(5);
    const cylpBalanceRaw = get(6);
    const stakedCylpAmountRaw = get(7);
    const feeCylpClaimableRaw = get(8);
    const cylpSupplyRaw = get(9);
    const esCyseFromCylpRaw = get(10);

    const feeCyseClaimable = fmt(feeCyseClaimableRaw);
    const feeCylpClaimable = fmt(feeCylpClaimableRaw);
    const esCyseClaimable = fmt(esCyseClaimableRaw) + fmt(esCyseFromCylpRaw);

    return {
      cyseBalance: fmt(cyseBalanceRaw),
      cyseBalanceRaw,
      stakedCyseAmount: fmt(stakedCyseAmountRaw),
      stakedCyseAmountRaw,
      bonusCyseAmount: fmt(bonusCyseRaw),
      feeCyseStaked: fmt(feeCyseStakedRaw),
      feeCyseClaimable,
      feeCyseClaimableRaw,
      esCyseClaimable,
      esCyseClaimableRaw,
      cylpBalance: fmt(cylpBalanceRaw),
      cylpBalanceRaw,
      stakedCylpAmount: fmt(stakedCylpAmountRaw),
      stakedCylpAmountRaw,
      feeCylpClaimable,
      feeCylpClaimableRaw,
      cylpSupply: fmt(cylpSupplyRaw),
      cylpSupplyRaw,
      totalStakedValueUsd: 0, // computed in UI with price
      totalClaimableEth: feeCyseClaimable + feeCylpClaimable,
      totalClaimableEsCyse: esCyseClaimable,
      isLoading,
    };
  }, [data, isLoading]);
}

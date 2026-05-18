"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { contracts } from "@/lib/protocol/contracts";

export interface VestingData {
  // esCYSE deposited into vester
  deposited: number;
  depositedRaw: bigint;
  // CYSE already claimable from vesting (vested but unclaimed)
  claimable: number;
  claimableRaw: bigint;
  // Maximum esCYSE the user can deposit for vesting based on staking history
  maxVestable: number;
  maxVestableRaw: bigint;
  // feeCyseTracker tokens locked as pair collateral for current deposit
  pairAmount: number;
  pairAmountRaw: bigint;
  // cumulative CYSE claimed from vester
  cumulativeClaimed: number;
  cumulativeClaimedRaw: bigint;
  remainingCapacity: number;
  remainingCapacityRaw: bigint;
}

export interface StakingData {
  // CYSE token
  cyseBalance: number;
  cyseBalanceRaw: bigint;

  // esCYSE wallet balance
  esCyseBalance: number;
  esCyseBalanceRaw: bigint;

  // Staked CYSE (in StakedCyseTracker)
  stakedCyseAmount: number;
  stakedCyseAmountRaw: bigint;

  // Combined CYSE + esCYSE in the staked tracker
  totalCyseStakedAmount: number;
  totalCyseStakedAmountRaw: bigint;

  // bnCYSE / multiplier points currently staked through ExtendedCyseTracker
  bonusCyseAmount: number;
  bonusCyseAmountRaw: bigint;

  // CYSE reward stream from ExtendedCyseTracker
  claimableCyse: number;
  claimableCyseRaw: bigint;

  // Fee CYSE tracker (earns WETH fees)
  feeCyseStaked: number;
  feeCyseClaimable: number;
  feeCyseClaimableRaw: bigint;

  // esCYSE staked in StakedCyseTracker (depositBalances for esCYSE token)
  stakedEsCyseAmount: number;
  stakedEsCyseAmountRaw: bigint;

  // esCYSE claimable from StakedCyseTracker + StakedCylpTracker
  esCyseClaimable: number;
  esCyseClaimableRaw: bigint;
  esCyseFromCylpRaw: bigint;

  // bnCYSE claimable from bonusCyseTracker
  bonusCyseClaimable: number;
  bonusCyseClaimableRaw: bigint;

  // CYLP (vault LP token)
  cylpBalance: number;
  cylpBalanceRaw: bigint;

  // Staked CYLP (in StakedCylpTracker via feeCylpTracker)
  stakedCylpAmount: number;
  stakedCylpAmountRaw: bigint;

  // Fee CYLP tracker (earns WETH fees)
  feeCylpClaimable: number;
  feeCylpClaimableRaw: bigint;

  // CYLP supply & price (price = AUM / supply)
  cylpSupply: number;
  cylpSupplyRaw: bigint;
  cylpPrice: number;

  // Vesting: CyseVester (esCYSE → CYSE)
  cyseVesting: VestingData;
  // Vesting: CylpVester (esCYSE → CYSE via CYLP staking history)
  cylpVesting: VestingData;

  // Totals
 totalClaimableCyse: number;
  totalStakedValueUsd: number;
 totalEarnPositionUsd: number;
 cylpStakeValueUsd: number;
  totalClaimableEth: number;
  totalClaimableEsCyse: number;

  isLoading: boolean;
}

const ZERO = 0n;
const fmt = (v: bigint | undefined, d = 18) =>
  v ? parseFloat(formatUnits(v, d)) : 0;

export function useStakingData(): StakingData {
  const { address } = useAccount();
  const { data: extendedCyseTrackerAddress, isLoading: isExtendedTrackerLoading } = useReadContract({
    ...contracts.rewardRouter,
    functionName: "extendedCyseTracker",
    query: { staleTime: 30_000 },
  });

  const extendedCyseTracker = useMemo(() => {
    if (!extendedCyseTrackerAddress) {
      return null;
    }

    return {
      address: extendedCyseTrackerAddress,
      abi: contracts.stakedCyseTracker.abi,
    };
  }, [extendedCyseTrackerAddress]);

  // ── Batch read: balances, staked amounts, claimable, vesting ─────
  const calls = useMemo(() => {
    if (!address || !extendedCyseTracker) return [];

    return [
      // 0: CYSE balance
      { ...contracts.cyse, functionName: "balanceOf" as const, args: [address] as const },
      // 1: esCYSE wallet balance
      { ...contracts.escyse, functionName: "balanceOf" as const, args: [address] as const },
      // 2: stakedCyseTracker.stakedAmounts(user) — total CYSE + esCYSE in the tracker
      { ...contracts.stakedCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 3: stakedCyseTracker.depositBalances(user, CYSE)
      { ...contracts.stakedCyseTracker, functionName: "depositBalances" as const, args: [address, contracts.cyse.address] as const },
      // 4: stakedCyseTracker.depositBalances(user, esCYSE)
      { ...contracts.stakedCyseTracker, functionName: "depositBalances" as const, args: [address, contracts.escyse.address] as const },
      // 5: bonusCyseTracker.claimable(user) — pending bnCYSE rewards
      { ...contracts.bonusCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 6: extendedCyseTracker.depositBalances(user, bnCYSE)
      { ...extendedCyseTracker, functionName: "depositBalances" as const, args: [address, contracts.bonusCyse.address] as const },
      // 7: extendedCyseTracker.claimable(user) — CYSE rewards from the extended layer
      { ...extendedCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 8: feeCyseTracker.stakedAmounts(user)
      { ...contracts.feeCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 9: feeCyseTracker.claimable(user) — WETH fees from CYSE staking
      { ...contracts.feeCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 10: stakedCyseTracker.claimable(user) — esCYSE from CYSE staking
      { ...contracts.stakedCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 11: CYLP balance (unstaked)
      { ...contracts.cylp, functionName: "balanceOf" as const, args: [address] as const },
      // 12: stakedCylpTracker.stakedAmounts(user)
      { ...contracts.stakedCylpTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 13: feeCylpTracker.claimable(user) — WETH fees from CYLP staking
      { ...contracts.feeCylpTracker, functionName: "claimable" as const, args: [address] as const },
      // 14: CYLP totalSupply
      { ...contracts.cylp, functionName: "totalSupply" as const },
      // 15: stakedCylpTracker.claimable(user) — esCYSE from CYLP staking
      { ...contracts.stakedCylpTracker, functionName: "claimable" as const, args: [address] as const },
      // 16: cylpManager.getAum(false) — min AUM for CYLP price calculation
      { ...contracts.cylpManager, functionName: "getAum" as const, args: [false] as const },
      // ── CyseVester ──
      // 17: cyseVester.balanceOf(user) — esTokens deposited
      { ...contracts.cyseVester, functionName: "balanceOf" as const, args: [address] as const },
      // 18: cyseVester.claimable(user) — CYSE claimable now
      { ...contracts.cyseVester, functionName: "claimable" as const, args: [address] as const },
      // 19: cyseVester.getMaxVestableAmount(user) — max esCYSE user can deposit
      { ...contracts.cyseVester, functionName: "getMaxVestableAmount" as const, args: [address] as const },
      // 20: cyseVester.pairAmounts(user) — feeCyseTracker tokens locked
      { ...contracts.cyseVester, functionName: "pairAmounts" as const, args: [address] as const },
      // 21: cyseVester.claimedAmounts(user) — cumulative CYSE claimed
      { ...contracts.cyseVester, functionName: "claimedAmounts" as const, args: [address] as const },
      // ── CylpVester ──
      // 22: cylpVester.balanceOf(user) — esTokens deposited
      { ...contracts.cylpVester, functionName: "balanceOf" as const, args: [address] as const },
      // 23: cylpVester.claimable(user) — CYSE claimable now
      { ...contracts.cylpVester, functionName: "claimable" as const, args: [address] as const },
      // 24: cylpVester.getMaxVestableAmount(user)
      { ...contracts.cylpVester, functionName: "getMaxVestableAmount" as const, args: [address] as const },
      // 25: cylpVester.pairAmounts(user) — stakedCylpTracker tokens locked
      { ...contracts.cylpVester, functionName: "pairAmounts" as const, args: [address] as const },
      // 26: cylpVester.claimedAmounts(user)
      { ...contracts.cylpVester, functionName: "claimedAmounts" as const, args: [address] as const },
    ];
  }, [address, extendedCyseTracker]);

  const { data, isLoading } = useReadContracts({
    contracts: calls,
    query: { enabled: calls.length > 0, refetchInterval: 8_000 },
  });

  return useMemo(() => {
    const get = (i: number): bigint =>
      data && data[i]?.status === "success" ? (data[i].result as bigint) : ZERO;

    const cyseBalanceRaw            = get(0);
    const esCyseBalanceRaw          = get(1);
    const totalCyseStakedAmountRaw  = get(2);
    const stakedCyseAmountRaw       = get(3);
    const stakedEsCyseAmountRaw     = get(4);
    const bonusCyseClaimableRaw     = get(5);
    const bonusCyseAmountRaw        = get(6);
    const claimableCyseRaw          = get(7);
    const feeCyseStakedRaw          = get(8);
    const feeCyseClaimableRaw       = get(9);
    const esCyseClaimableRaw        = get(10);
    const cylpBalanceRaw            = get(11);
    const stakedCylpAmountRaw       = get(12);
    const feeCylpClaimableRaw       = get(13);
    const cylpSupplyRaw             = get(14);
    const esCyseFromCylpRaw         = get(15);
    const aumRaw                    = get(16);

    // CyseVester
    const cyseVestDepositedRaw       = get(17);
    const cyseVestClaimableRaw       = get(18);
    const cyseVestMaxRaw             = get(19);
    const cyseVestPairRaw            = get(20);
    const cyseVestClaimedRaw         = get(21);

    // CylpVester
    const cylpVestDepositedRaw       = get(22);
    const cylpVestClaimableRaw       = get(23);
    const cylpVestMaxRaw             = get(24);
    const cylpVestPairRaw            = get(25);
    const cylpVestClaimedRaw         = get(26);

    const feeCyseClaimable = fmt(feeCyseClaimableRaw);
    const feeCylpClaimable = fmt(feeCylpClaimableRaw);
    const claimableCyse = fmt(claimableCyseRaw);
    const esCyseClaimable = fmt(esCyseClaimableRaw) + fmt(esCyseFromCylpRaw);

    // CYLP price = AUM (USD, 30-dec) / supply (18-dec) → USD per CYLP (18-dec)
    const cylpSupply = fmt(cylpSupplyRaw);
    const aum = aumRaw > 0n ? parseFloat(formatUnits(aumRaw, 30)) : 0;
    const cylpPrice = cylpSupply > 0 ? aum / cylpSupply : 0;
    const cylpStakeValueUsd = fmt(stakedCylpAmountRaw) * cylpPrice;

    const cyseVestRemainingCapacityRaw = cyseVestMaxRaw > cyseVestDepositedRaw
      ? cyseVestMaxRaw - cyseVestDepositedRaw
      : ZERO;
    const cylpVestRemainingCapacityRaw = cylpVestMaxRaw > cylpVestDepositedRaw
      ? cylpVestMaxRaw - cylpVestDepositedRaw
      : ZERO;

    const cyseVesting: VestingData = {
      deposited: fmt(cyseVestDepositedRaw),
      depositedRaw: cyseVestDepositedRaw,
      claimable: fmt(cyseVestClaimableRaw),
      claimableRaw: cyseVestClaimableRaw,
      maxVestable: fmt(cyseVestMaxRaw),
      maxVestableRaw: cyseVestMaxRaw,
      pairAmount: fmt(cyseVestPairRaw),
      pairAmountRaw: cyseVestPairRaw,
      cumulativeClaimed: fmt(cyseVestClaimedRaw),
      cumulativeClaimedRaw: cyseVestClaimedRaw,
      remainingCapacity: fmt(cyseVestRemainingCapacityRaw),
      remainingCapacityRaw: cyseVestRemainingCapacityRaw,
    };

    const cylpVesting: VestingData = {
      deposited: fmt(cylpVestDepositedRaw),
      depositedRaw: cylpVestDepositedRaw,
      claimable: fmt(cylpVestClaimableRaw),
      claimableRaw: cylpVestClaimableRaw,
      maxVestable: fmt(cylpVestMaxRaw),
      maxVestableRaw: cylpVestMaxRaw,
      pairAmount: fmt(cylpVestPairRaw),
      pairAmountRaw: cylpVestPairRaw,
      cumulativeClaimed: fmt(cylpVestClaimedRaw),
      cumulativeClaimedRaw: cylpVestClaimedRaw,
      remainingCapacity: fmt(cylpVestRemainingCapacityRaw),
      remainingCapacityRaw: cylpVestRemainingCapacityRaw,
    };

    return {
      cyseBalance: fmt(cyseBalanceRaw),
      cyseBalanceRaw,
      esCyseBalance: fmt(esCyseBalanceRaw),
      esCyseBalanceRaw,
      stakedCyseAmount: fmt(stakedCyseAmountRaw),
      stakedCyseAmountRaw,
      totalCyseStakedAmount: fmt(totalCyseStakedAmountRaw),
      totalCyseStakedAmountRaw,
      bonusCyseAmount: fmt(bonusCyseAmountRaw),
      bonusCyseAmountRaw,
      bonusCyseClaimable: fmt(bonusCyseClaimableRaw),
      bonusCyseClaimableRaw,
      claimableCyse,
      claimableCyseRaw,
      stakedEsCyseAmount: fmt(stakedEsCyseAmountRaw),
      stakedEsCyseAmountRaw,
      feeCyseStaked: fmt(feeCyseStakedRaw),
      feeCyseClaimable,
      feeCyseClaimableRaw,
      esCyseClaimable,
      esCyseClaimableRaw,
      esCyseFromCylpRaw,
      cylpBalance: fmt(cylpBalanceRaw),
      cylpBalanceRaw,
      stakedCylpAmount: fmt(stakedCylpAmountRaw),
      stakedCylpAmountRaw,
      feeCylpClaimable,
      feeCylpClaimableRaw,
      cylpSupply,
      cylpSupplyRaw,
      cylpPrice,
      cyseVesting,
      cylpVesting,
      totalClaimableCyse: claimableCyse + cyseVesting.claimable + cylpVesting.claimable,
      totalStakedValueUsd: cylpStakeValueUsd,
      totalEarnPositionUsd: cylpStakeValueUsd,
      cylpStakeValueUsd,
      totalClaimableEth: feeCyseClaimable + feeCylpClaimable,
      totalClaimableEsCyse: esCyseClaimable,
      isLoading: isLoading || isExtendedTrackerLoading,
    };
  }, [data, isExtendedTrackerLoading, isLoading]);
}

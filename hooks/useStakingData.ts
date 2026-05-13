"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
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

  // Bonus CYSE tracker (bnCYSE — multiplier points)
  bonusCyseAmount: number;
  bonusCyseAmountRaw: bigint;

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

  // ── Batch read: balances, staked amounts, claimable, vesting ─────
  const calls = useMemo(() => {
    if (!address) return [];
    return [
      // 0: CYSE balance
      { ...contracts.cyse, functionName: "balanceOf" as const, args: [address] as const },
      // 1: esCYSE wallet balance
      { ...contracts.escyse, functionName: "balanceOf" as const, args: [address] as const },
      // 2: stakedCyseTracker.stakedAmounts(user)
      { ...contracts.stakedCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 3: bonusCyseTracker.stakedAmounts(user) — bnCYSE / multiplier points
      { ...contracts.bonusCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 3b: bonusCyseTracker.claimable(user) — pending bnCYSE rewards
      { ...contracts.bonusCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 3c: stakedCyseTracker.depositBalances(user, esCYSE) — esCYSE staked separately
      { ...contracts.stakedCyseTracker, functionName: "depositBalances" as const, args: [address, contracts.escyse.address] as const },
      // 4: feeCyseTracker.stakedAmounts(user)
      { ...contracts.feeCyseTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 5: feeCyseTracker.claimable(user) — WETH fees from CYSE staking
      { ...contracts.feeCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 6: stakedCyseTracker.claimable(user) — esCYSE from CYSE staking
      { ...contracts.stakedCyseTracker, functionName: "claimable" as const, args: [address] as const },
      // 7: CYLP balance (unstaked)
      { ...contracts.cylp, functionName: "balanceOf" as const, args: [address] as const },
      // 8: stakedCylpTracker.stakedAmounts(user)
      { ...contracts.stakedCylpTracker, functionName: "stakedAmounts" as const, args: [address] as const },
      // 9: feeCylpTracker.claimable(user) — WETH fees from CYLP staking
      { ...contracts.feeCylpTracker, functionName: "claimable" as const, args: [address] as const },
      // 10: CYLP totalSupply
      { ...contracts.cylp, functionName: "totalSupply" as const },
      // 11: stakedCylpTracker.claimable(user) — esCYSE from CYLP staking
      { ...contracts.stakedCylpTracker, functionName: "claimable" as const, args: [address] as const },
      // 12: cylpManager.getAum(false) — min AUM for CYLP price calculation
      { ...contracts.cylpManager, functionName: "getAum" as const, args: [false] as const },
      // ── CyseVester ──
      // 13: cyseVester.balanceOf(user) — esTokens deposited
      { ...contracts.cyseVester, functionName: "balanceOf" as const, args: [address] as const },
      // 14: cyseVester.claimable(user) — CYSE claimable now
      { ...contracts.cyseVester, functionName: "claimable" as const, args: [address] as const },
      // 15: cyseVester.getMaxVestableAmount(user) — max esCYSE user can deposit
      { ...contracts.cyseVester, functionName: "getMaxVestableAmount" as const, args: [address] as const },
      // 16: cyseVester.pairAmounts(user) — feeCyseTracker tokens locked
      { ...contracts.cyseVester, functionName: "pairAmounts" as const, args: [address] as const },
      // 17: cyseVester.claimedAmounts(user) — cumulative CYSE claimed
      { ...contracts.cyseVester, functionName: "claimedAmounts" as const, args: [address] as const },
      // ── CylpVester ──
      // 18: cylpVester.balanceOf(user) — esTokens deposited
      { ...contracts.cylpVester, functionName: "balanceOf" as const, args: [address] as const },
      // 19: cylpVester.claimable(user) — CYSE claimable now
      { ...contracts.cylpVester, functionName: "claimable" as const, args: [address] as const },
      // 20: cylpVester.getMaxVestableAmount(user)
      { ...contracts.cylpVester, functionName: "getMaxVestableAmount" as const, args: [address] as const },
      // 21: cylpVester.pairAmounts(user) — stakedCylpTracker tokens locked
      { ...contracts.cylpVester, functionName: "pairAmounts" as const, args: [address] as const },
      // 22: cylpVester.claimedAmounts(user)
      { ...contracts.cylpVester, functionName: "claimedAmounts" as const, args: [address] as const },
    ];
  }, [address]);

  const { data, isLoading } = useReadContracts({
    contracts: calls,
    query: { enabled: calls.length > 0, refetchInterval: 8_000 },
  });

  return useMemo(() => {
    const get = (i: number): bigint =>
      data && data[i]?.status === "success" ? (data[i].result as bigint) : ZERO;

    const cyseBalanceRaw       = get(0);
    const esCyseBalanceRaw     = get(1);
    const stakedCyseAmountRaw  = get(2);
    const bonusCyseAmountRaw   = get(3);
    const bonusCyseClaimableRaw = get(4);
    const stakedEsCyseAmountRaw = get(5);
    const feeCyseStakedRaw     = get(6);
    const feeCyseClaimableRaw  = get(7);
    const esCyseClaimableRaw   = get(8);
    const cylpBalanceRaw       = get(9);
    const stakedCylpAmountRaw  = get(10);
    const feeCylpClaimableRaw  = get(11);
    const cylpSupplyRaw        = get(12);
    const esCyseFromCylpRaw    = get(13);
    const aumRaw               = get(14);

    // CyseVester
    const cyseVestDepositedRaw  = get(15);
    const cyseVestClaimableRaw  = get(16);
    const cyseVestMaxRaw        = get(17);
    const cyseVestPairRaw       = get(18);
    const cyseVestClaimedRaw    = get(19);

    // CylpVester
    const cylpVestDepositedRaw  = get(20);
    const cylpVestClaimableRaw  = get(21);
    const cylpVestMaxRaw        = get(22);
    const cylpVestPairRaw       = get(23);
    const cylpVestClaimedRaw    = get(24);

    const feeCyseClaimable  = fmt(feeCyseClaimableRaw);
    const feeCylpClaimable  = fmt(feeCylpClaimableRaw);
    const esCyseClaimable   = fmt(esCyseClaimableRaw) + fmt(esCyseFromCylpRaw);

    // CYLP price = AUM (USD, 30-dec) / supply (18-dec) → USD per CYLP (18-dec)
    const cylpSupply = fmt(cylpSupplyRaw);
    const aum = aumRaw > 0n ? parseFloat(formatUnits(aumRaw, 30)) : 0;
    const cylpPrice = cylpSupply > 0 ? aum / cylpSupply : 0;

    const cyseVesting: VestingData = {
      deposited:        fmt(cyseVestDepositedRaw),
      depositedRaw:     cyseVestDepositedRaw,
      claimable:        fmt(cyseVestClaimableRaw),
      claimableRaw:     cyseVestClaimableRaw,
      maxVestable:      fmt(cyseVestMaxRaw),
      maxVestableRaw:   cyseVestMaxRaw,
      pairAmount:       fmt(cyseVestPairRaw),
      pairAmountRaw:    cyseVestPairRaw,
      cumulativeClaimed: fmt(cyseVestClaimedRaw),
    };

    const cylpVesting: VestingData = {
      deposited:        fmt(cylpVestDepositedRaw),
      depositedRaw:     cylpVestDepositedRaw,
      claimable:        fmt(cylpVestClaimableRaw),
      claimableRaw:     cylpVestClaimableRaw,
      maxVestable:      fmt(cylpVestMaxRaw),
      maxVestableRaw:   cylpVestMaxRaw,
      pairAmount:       fmt(cylpVestPairRaw),
      pairAmountRaw:    cylpVestPairRaw,
      cumulativeClaimed: fmt(cylpVestClaimedRaw),
    };

    return {
      cyseBalance: fmt(cyseBalanceRaw),
      cyseBalanceRaw,
      esCyseBalance: fmt(esCyseBalanceRaw),
      esCyseBalanceRaw,
      stakedCyseAmount: fmt(stakedCyseAmountRaw),
      stakedCyseAmountRaw,
      bonusCyseAmount: fmt(bonusCyseAmountRaw),
      bonusCyseAmountRaw,
      bonusCyseClaimable: fmt(bonusCyseClaimableRaw),
      bonusCyseClaimableRaw,
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
      totalStakedValueUsd: 0, // computed in UI with price feed
      totalClaimableEth: feeCyseClaimable + feeCylpClaimable,
      totalClaimableEsCyse: esCyseClaimable,
      isLoading,
    };
  }, [data, isLoading]);
}

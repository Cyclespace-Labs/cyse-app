"use client";

import { useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { contracts } from "@/lib/protocol/contracts";

export function useStakingActions() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  // ── Stake CYSE ─────────────────────────────────────────────────
  const stakeCyse = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      const value = parseUnits(amount, 18);

      // Approve StakedCyseTracker to spend CYSE
      await writeContractAsync({
        ...contracts.cyse,
        functionName: "approve",
        args: [contracts.stakedCyseTracker.address, value],
      });

      const hash = await writeContractAsync({
        ...contracts.rewardRouterV2,
        functionName: "stakeCyse",
        args: [value],
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  // ── Unstake CYSE ───────────────────────────────────────────────
  const unstakeCyse = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      const value = parseUnits(amount, 18);
      const hash = await writeContractAsync({
        ...contracts.rewardRouterV2,
        functionName: "unstakeCyse",
        args: [value],
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  // ── Compound all rewards ───────────────────────────────────────
  const compound = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    const hash = await writeContractAsync({
      ...contracts.rewardRouterV2,
      functionName: "compound",
    });
    return hash;
  }, [address, writeContractAsync]);

  // ── Claim all rewards (ETH fees + esCYSE) ─────────────────────
  const claimRewards = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    const hash = await writeContractAsync({
      ...contracts.rewardRouterV2,
      functionName: "handleRewards",
      args: [
        true,  // _shouldClaimCyse
        false, // _shouldStakeCyse
        true,  // _shouldClaimEsCyse
        false, // _shouldStakeEsCyse
        true,  // _shouldStakeMultiplierPoints
        true,  // _shouldClaimWeth
        true,  // _shouldConvertWethToEth
      ],
    });
    return hash;
  }, [address, writeContractAsync]);

  // ── Claim and restake (compound esCYSE + stake multiplier pts) ─
  const claimAndRestake = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    const hash = await writeContractAsync({
      ...contracts.rewardRouterV2,
      functionName: "handleRewards",
      args: [
        true,  // _shouldClaimCyse
        true,  // _shouldStakeCyse
        true,  // _shouldClaimEsCyse
        true,  // _shouldStakeEsCyse
        true,  // _shouldStakeMultiplierPoints
        true,  // _shouldClaimWeth
        true,  // _shouldConvertWethToEth
      ],
    });
    return hash;
  }, [address, writeContractAsync]);

  // ── Mint & Stake CYLP with ETH (add vault liquidity) ──────────
  const addLiquidityETH = useCallback(
    async (ethAmount: string) => {
      if (!address) throw new Error("Wallet not connected");
      const value = parseUnits(ethAmount, 18);
      const hash = await writeContractAsync({
        ...contracts.rewardRouterV2,
        functionName: "mintAndStakeCylpETH",
        args: [0n, 0n], // minUsdg, minCylp — accept any
        value,
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  // ── Mint & Stake CYLP with ERC-20 token ────────────────────────
  const addLiquidityToken = useCallback(
    async (tokenAddress: `0x${string}`, amount: string, decimals = 18) => {
      if (!address) throw new Error("Wallet not connected");
      const value = parseUnits(amount, decimals);

      // Approve CylpManager via RewardRouter
      await writeContractAsync({
        address: tokenAddress,
        abi: contracts.cyse.abi, // generic ERC-20 approve
        functionName: "approve",
        args: [contracts.cylpManager.address, value],
      });

      const hash = await writeContractAsync({
        ...contracts.rewardRouterV2,
        functionName: "mintAndStakeCylp",
        args: [tokenAddress, value, 0n, 0n],
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  // ── Unstake & Redeem CYLP → ETH ───────────────────────────────
  const removeLiquidityETH = useCallback(
    async (cylpAmount: string) => {
      if (!address) throw new Error("Wallet not connected");
      const value = parseUnits(cylpAmount, 18);
      const hash = await writeContractAsync({
        ...contracts.rewardRouterV2,
        functionName: "unstakeAndRedeemCylpETH",
        args: [value, 0n, address],
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  // ── Unstake & Redeem CYLP → ERC-20 ────────────────────────────
  const removeLiquidityToken = useCallback(
    async (tokenOut: `0x${string}`, cylpAmount: string) => {
      if (!address) throw new Error("Wallet not connected");
      const value = parseUnits(cylpAmount, 18);
      const hash = await writeContractAsync({
        ...contracts.rewardRouterV2,
        functionName: "unstakeAndRedeemCylp",
        args: [tokenOut, value, 0n, address],
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  return {
    stakeCyse,
    unstakeCyse,
    compound,
    claimRewards,
    claimAndRestake,
    addLiquidityETH,
    addLiquidityToken,
    removeLiquidityETH,
    removeLiquidityToken,
    isPending,
  };
}

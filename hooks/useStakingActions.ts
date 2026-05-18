"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { maxUint256, parseUnits, type Abi, type Address, type Hash } from "viem";
import { contracts, erc20Abi } from "@/lib/protocol/contracts";

type ApprovalConfig = {
  token: Address;
  spender: Address;
  amount: bigint;
  abi?: Abi;
  approveAmount?: bigint;
};

type LiquidityOptions = {
  minUsdg?: bigint;
  minCylp?: bigint;
  minOut?: bigint;
};

type InternalWriteRequest = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
};

export function useStakingActions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const assertReady = useCallback(() => {
    if (!address) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client unavailable");
  }, [address, publicClient]);

  const executeWrite = useCallback(
    async (request: InternalWriteRequest): Promise<Hash> => {
      assertReady();

      const hash = await writeContractAsync(request as Parameters<typeof writeContractAsync>[0]);
      await publicClient!.waitForTransactionReceipt({ hash });

      return hash;
    },
    [assertReady, publicClient, writeContractAsync]
  );

  const ensureAllowance = useCallback(
    async ({ token, spender, amount, abi = erc20Abi, approveAmount = maxUint256 }: ApprovalConfig) => {
      assertReady();

      const allowance = (await publicClient!.readContract({
        address: token,
        abi,
        functionName: "allowance",
        args: [address!, spender],
      })) as bigint;

      if (allowance >= amount) {
        return;
      }

      await executeWrite({
        address: token,
        abi,
        functionName: "approve",
        args: [spender, approveAmount],
      });
    },
    [address, assertReady, executeWrite, publicClient]
  );

  const runAction = useCallback(
    async (label: string, runner: () => Promise<Hash>) => {
      assertReady();
      setPendingLabel(label);

      try {
        const hash = await runner();
        await queryClient.invalidateQueries();
        return hash;
      } finally {
        setPendingLabel(null);
      }
    },
    [assertReady, queryClient]
  );

  const ensureCompoundApprovals = useCallback(async () => {
    await ensureAllowance({
      token: contracts.cyse.address,
      spender: contracts.stakedCyseTracker.address,
      amount: 1n,
    });

    await ensureAllowance({
      token: contracts.escyse.address,
      spender: contracts.stakedCyseTracker.address,
      amount: 1n,
    });
  }, [ensureAllowance]);

  // ── Stake CYSE ─────────────────────────────────────────────────
  const stakeCyse = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, 18);
      return runAction("stakeCyse", async () => {
        await ensureAllowance({
          token: contracts.cyse.address,
          spender: contracts.stakedCyseTracker.address,
          amount: value,
        });

        return executeWrite({
          ...contracts.rewardRouter,
          functionName: "stakeCyse",
          args: [value],
        });
      });
    },
    [ensureAllowance, executeWrite, runAction]
  );

  // ── Unstake CYSE ───────────────────────────────────────────────
  const unstakeCyse = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, 18);
      return runAction("unstakeCyse", () => executeWrite({
        ...contracts.rewardRouter,
        functionName: "unstakeCyse",
        args: [value],
      }));
    },
    [executeWrite, runAction]
  );

  // ── Stake esCYSE ───────────────────────────────────────────────
  const stakeEsCyse = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, 18);
      return runAction("stakeEsCyse", async () => {
        await ensureAllowance({
          token: contracts.escyse.address,
          spender: contracts.stakedCyseTracker.address,
          amount: value,
        });

        return executeWrite({
          ...contracts.rewardRouter,
          functionName: "stakeEsCyse",
          args: [value],
        });
      });
    },
    [ensureAllowance, executeWrite, runAction]
  );

  // ── Unstake esCYSE ─────────────────────────────────────────────
  const unstakeEsCyse = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, 18);
      return runAction("unstakeEsCyse", () => executeWrite({
        ...contracts.rewardRouter,
        functionName: "unstakeEsCyse",
        args: [value],
      }));
    },
    [executeWrite, runAction]
  );

  // ── Compound all rewards ───────────────────────────────────────
  const compound = useCallback(async () => {
    return runAction("compound", async () => {
      await ensureCompoundApprovals();

      return executeWrite({
        ...contracts.rewardRouter,
        functionName: "compound",
      });
    });
  }, [ensureCompoundApprovals, executeWrite, runAction]);

  // ── Claim reward streams to wallet (CYSE + esCYSE + ETH) ──────
  const claimRewards = useCallback(async () => {
    return runAction("claimRewards", () => executeWrite({
      ...contracts.rewardRouter,
      functionName: "handleRewardsV2",
      args: [
        address!,
        true,
        false,
        true,
        false,
        true,
        true,
        true,
      ],
    }));
  }, [address, executeWrite, runAction]);

  const claimFees = useCallback(async () => {
    return runAction("claimFees", () => executeWrite({
      ...contracts.rewardRouter,
      functionName: "claimFees",
    }));
  }, [executeWrite, runAction]);

  const claimEsCyse = useCallback(async () => {
    return runAction("claimEsCyse", () => executeWrite({
      ...contracts.rewardRouter,
      functionName: "claimEsCyse",
    }));
  }, [executeWrite, runAction]);

  // ── Claim and restake (compound esCYSE + stake multiplier pts) ─
  const claimAndRestake = useCallback(async () => {
    return runAction("claimAndRestake", async () => {
      await ensureCompoundApprovals();

      return executeWrite({
        ...contracts.rewardRouter,
        functionName: "handleRewardsV2",
        args: [
          address!,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
        ],
      });
    });
  }, [address, ensureCompoundApprovals, executeWrite, runAction]);

  // ── Deposit esCYSE into CyseVester ────────────────────────────
  const depositVestingCyse = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, 18);
      return runAction("depositVestingCyse", async () => {
        await ensureAllowance({
          token: contracts.escyse.address,
          spender: contracts.cyseVester.address,
          amount: value,
        });

        await ensureAllowance({
          token: contracts.feeCyseTracker.address,
          spender: contracts.cyseVester.address,
          amount: 1n,
          abi: contracts.feeCyseTracker.abi,
        });

        return executeWrite({
          ...contracts.cyseVester,
          functionName: "deposit",
          args: [value],
        });
      });
    },
    [ensureAllowance, executeWrite, runAction]
  );

  // ── Withdraw from CyseVester (returns unvested esCYSE + any claimable CYSE) ─
  const withdrawVestingCyse = useCallback(async () => {
    return runAction("withdrawVestingCyse", () => executeWrite({
      ...contracts.cyseVester,
      functionName: "withdraw",
    }));
  }, [executeWrite, runAction]);

  // ── Claim vested CYSE from CyseVester ─────────────────────────
  const claimVestedCyse = useCallback(async () => {
    return runAction("claimVestedCyse", () => executeWrite({
      ...contracts.cyseVester,
      functionName: "claim",
    }));
  }, [executeWrite, runAction]);

  // ── Deposit esCYSE into CylpVester ────────────────────────────
  const depositVestingCylp = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, 18);
      return runAction("depositVestingCylp", async () => {
        await ensureAllowance({
          token: contracts.escyse.address,
          spender: contracts.cylpVester.address,
          amount: value,
        });

        await ensureAllowance({
          token: contracts.stakedCylpTracker.address,
          spender: contracts.cylpVester.address,
          amount: 1n,
          abi: contracts.stakedCylpTracker.abi,
        });

        return executeWrite({
          ...contracts.cylpVester,
          functionName: "deposit",
          args: [value],
        });
      });
    },
    [ensureAllowance, executeWrite, runAction]
  );

  // ── Withdraw from CylpVester ───────────────────────────────────
  const withdrawVestingCylp = useCallback(async () => {
    return runAction("withdrawVestingCylp", () => executeWrite({
      ...contracts.cylpVester,
      functionName: "withdraw",
    }));
  }, [executeWrite, runAction]);

  // ── Claim vested CYSE from CylpVester ─────────────────────────
  const claimVestedCylp = useCallback(async () => {
    return runAction("claimVestedCylp", () => executeWrite({
      ...contracts.cylpVester,
      functionName: "claim",
    }));
  }, [executeWrite, runAction]);

  // ── Mint & Stake CYLP with ETH (add vault liquidity) ──────────
  const addLiquidityETH = useCallback(
    async (ethAmount: string, options?: LiquidityOptions) => {
      const value = parseUnits(ethAmount, 18);
      return runAction("addLiquidityETH", () => executeWrite({
        ...contracts.rewardRouter,
        functionName: "mintAndStakeCylpETH",
        args: [options?.minUsdg ?? 0n, options?.minCylp ?? 0n],
        value,
      }));
    },
    [executeWrite, runAction]
  );

  // ── Mint & Stake CYLP with ERC-20 token ────────────────────────
  const addLiquidityToken = useCallback(
    async (tokenAddress: `0x${string}`, amount: string, decimals = 18, options?: LiquidityOptions) => {
      const value = parseUnits(amount, decimals);
      return runAction("addLiquidityToken", async () => {
        await ensureAllowance({
          token: tokenAddress,
          spender: contracts.cylpManager.address,
          amount: value,
        });

        return executeWrite({
          ...contracts.rewardRouter,
          functionName: "mintAndStakeCylp",
          args: [tokenAddress, value, options?.minUsdg ?? 0n, options?.minCylp ?? 0n],
        });
      });
    },
    [ensureAllowance, executeWrite, runAction]
  );

  // ── Unstake & Redeem CYLP → ETH ───────────────────────────────
  const removeLiquidityETH = useCallback(
    async (cylpAmount: string, options?: LiquidityOptions) => {
      const value = parseUnits(cylpAmount, 18);
      return runAction("removeLiquidityETH", () => executeWrite({
        ...contracts.rewardRouter,
        functionName: "unstakeAndRedeemCylpETH",
        args: [value, options?.minOut ?? 0n, address!],
      }));
    },
    [address, executeWrite, runAction]
  );

  // ── Unstake & Redeem CYLP → ERC-20 ────────────────────────────
  const removeLiquidityToken = useCallback(
    async (tokenOut: `0x${string}`, cylpAmount: string, options?: LiquidityOptions) => {
      const value = parseUnits(cylpAmount, 18);
      return runAction("removeLiquidityToken", () => executeWrite({
        ...contracts.rewardRouter,
        functionName: "unstakeAndRedeemCylp",
        args: [tokenOut, value, options?.minOut ?? 0n, address!],
      }));
    },
    [address, executeWrite, runAction]
  );

  const signalTransfer = useCallback(async (receiver: Address) => {
    return runAction("signalTransfer", () => executeWrite({
      ...contracts.rewardRouter,
      functionName: "signalTransfer",
      args: [receiver],
    }));
  }, [executeWrite, runAction]);

  const acceptTransfer = useCallback(async (sender: Address) => {
    return runAction("acceptTransfer", () => executeWrite({
      ...contracts.rewardRouter,
      functionName: "acceptTransfer",
      args: [sender],
    }));
  }, [executeWrite, runAction]);

  return {
    stakeCyse,
    unstakeCyse,
    stakeEsCyse,
    unstakeEsCyse,
    compound,
    claimRewards,
    claimFees,
    claimEsCyse,
    claimAndRestake,
    depositVestingCyse,
    withdrawVestingCyse,
    claimVestedCyse,
    depositVestingCylp,
    withdrawVestingCylp,
    claimVestedCylp,
    addLiquidityETH,
    addLiquidityToken,
    removeLiquidityETH,
    removeLiquidityToken,
    signalTransfer,
    acceptTransfer,
    pendingLabel,
    isPending: pendingLabel !== null,
  };
}

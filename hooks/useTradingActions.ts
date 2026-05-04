"use client";

import { useCallback, useState, useEffect } from "react";
import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { contracts, PRICE_PRECISION } from "@/lib/protocol/contracts";
import { TxStatus } from "@/types/protocol";

const EXECUTION_FEE = parseUnits("0.05", 18);
const BASIS_POINTS = 10000n;

function applySlippage(price: bigint, isLong: boolean, slippageBps: bigint): bigint {
  return isLong
    ? (price * (BASIS_POINTS + slippageBps)) / BASIS_POINTS
    : (price * (BASIS_POINTS - slippageBps)) / BASIS_POINTS;
}

export interface PlaceMarketOrderParams {
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  collateralAmount: bigint;
  sizeDelta: bigint;
  isLong: boolean;
  acceptablePrice: bigint;
  slippageBps?: bigint;
}

export interface PlaceLimitOrderParams {
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  collateralAmount: bigint;
  sizeDelta: bigint;
  isLong: boolean;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
}

export interface PlaceDecreaseOrderParams {
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  collateralDelta: bigint;
  sizeDelta: bigint;
  isLong: boolean;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
}

export interface PlaceTPSLOrdersParams {
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  collateralDelta: bigint;
  sizeDelta: bigint;
  isLong: boolean;
  tpPrice: bigint | null;
  slPrice: bigint | null;
}

export function useTradingActions() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [txStatus, setTxStatus] = useState<TxStatus>({ state: "idle" });
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();

  const { data: receipt, isSuccess: receiptSuccess } = useWaitForTransactionReceipt({
    hash: pendingHash,
    query: { enabled: !!pendingHash },
  });

  // Transition to confirmed when receipt arrives, then auto-reset after 5 s
  useEffect(() => {
    if (!receiptSuccess || !receipt) return;
    if (txStatus.state !== "submitted") return;
    console.log("[useTradingActions] tx confirmed", { hash: pendingHash, blockNumber: receipt.blockNumber?.toString() });
    setTxStatus({ state: "confirmed", hash: pendingHash });
    const timer = setTimeout(() => {
      setTxStatus({ state: "idle" });
      setPendingHash(undefined);
    }, 5_000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptSuccess, receipt]);

  const { data: minExecFee } = useReadContract({
    ...contracts.orderBook,
    functionName: "minExecutionFee",
    query: { staleTime: 60_000 },
  });

  // Add 20% buffer to the on-chain minExecutionFee to ensure the tx never
  // reverts with "insufficient execution fee" due to keeper fee changes.
  const executionFee =
    (minExecFee && minExecFee > 0n ? (minExecFee * 120n) / 100n : undefined) || EXECUTION_FEE;

  useEffect(() => {
    console.log("[useTradingActions] executionFee config", {
      minExecFee: minExecFee?.toString(),
      executionFee: executionFee.toString(),
      executionFeeEth: formatUnits(executionFee, 18),
    });
  }, [minExecFee, executionFee]);

  const { data: routerApprovedPositionManager } = useReadContract({
    ...contracts.router,
    functionName: "approvedPlugins",
    args: address ? [address, contracts.positionManager.address] : undefined,
    query: { enabled: !!address },
  });

  const { data: routerApprovedOrderBook } = useReadContract({
    ...contracts.router,
    functionName: "approvedPlugins",
    args: address ? [address, contracts.orderBook.address] : undefined,
    query: { enabled: !!address },
  });

  const routerApproved = !!routerApprovedPositionManager && !!routerApprovedOrderBook;

  const { data: vaultRouterApproved } = useReadContract({
    ...contracts.vault,
    functionName: "approvedRouters",
    args: address ? [address, contracts.router.address] : undefined,
    query: { enabled: !!address },
  });

  const approvePlugin = useCallback(async () => {
    setTxStatus({ state: "pending" });
    try {
      let hash: `0x${string}`;
      if (!routerApprovedPositionManager) {
        hash = await writeContractAsync({
          ...contracts.router,
          functionName: "approvePlugin",
          args: [contracts.positionManager.address],
          gas: 100_000n,
        });
      } else {
        hash = await writeContractAsync({
          ...contracts.router,
          functionName: "approvePlugin",
          args: [contracts.orderBook.address],
          gas: 100_000n,
        });
      }
      setPendingHash(hash);
      setTxStatus({ state: "submitted", hash });
      return hash;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Plugin approval failed";
      setTxStatus({ state: "failed", error: message });
      return null;
    }
  }, [routerApprovedPositionManager, writeContractAsync]);

  const approveVaultRouter = useCallback(async () => {
    if (!address) return null;
    setTxStatus({ state: "pending" });
    try {
      const hash = await writeContractAsync({
        ...contracts.vault,
        functionName: "addRouter",
        args: [contracts.router.address],
        gas: 100_000n,
      });
      setPendingHash(hash);
      setTxStatus({ state: "submitted", hash });
      return hash;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Vault router approval failed";
      setTxStatus({ state: "failed", error: message });
      return null;
    }
  }, [address, writeContractAsync]);

  const approveToken = useCallback(
    async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      setTxStatus({ state: "pending" });
      try {
        const hash = await writeContractAsync({
          ...contracts.weth,
          address: tokenAddress,
          functionName: "approve",
          args: [spender, amount],
          gas: 100_000n,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Token approval failed";
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [writeContractAsync]
  );

  // Short positions require stable collateral (USDC). When user selects WETH for a
  // short, the Router must swap wrapped ETH to USDC via a multi-hop path.
  function getShortPathAndCollateral(
    collateralToken: `0x${string}`,
    isLong: boolean
  ): { path: `0x${string}`[]; collateralToken: `0x${string}` } {
    if (isLong) {
      return { path: [collateralToken], collateralToken };
    }
    // Shorts require stable collateral
    if (collateralToken.toLowerCase() === contracts.weth.address.toLowerCase()) {
      return {
        path: [contracts.weth.address, contracts.usdc.address],
        collateralToken: contracts.usdc.address,
      };
    }
    return { path: [collateralToken], collateralToken };
  }

  const placeMarketOrder = useCallback(
    async ({
      collateralToken,
      indexToken,
      collateralAmount,
      sizeDelta,
      isLong,
      acceptablePrice,
      slippageBps = 30n,
    }: PlaceMarketOrderParams) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      try {
        const slippedPrice = applySlippage(acceptablePrice, isLong, slippageBps);
        const isEth = collateralToken.toLowerCase() === contracts.weth.address.toLowerCase();
        const { path } = getShortPathAndCollateral(collateralToken, isLong);

        // ETH collateral (longs OR shorts where WETH is swapped to USDC).
        // For shorts with WETH we still use increasePositionETH because the
        // Router wraps native ETH → WETH → swaps to USDC via the path.
        const hash = isEth
          ? await writeContractAsync({
              ...contracts.router,
              functionName: "increasePositionETH",
              args: [path, indexToken, 0n, sizeDelta, isLong, slippedPrice],
              value: collateralAmount,
              gas: 1_000_000n,
            })
          : await writeContractAsync({
              ...contracts.router,
              functionName: "increasePosition",
              args: [path, indexToken, collateralAmount, 0n, sizeDelta, isLong, slippedPrice],
              gas: 800_000n,
            });

        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Order failed";
        console.error("[placeMarketOrder] Error:", message, err);
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [address, writeContractAsync]
  );

  const closeMarketPosition = useCallback(
    async ({
      collateralToken,
      indexToken,
      sizeDelta,
      collateralDelta,
      isLong,
      acceptablePrice,
      slippageBps = 30n,
    }: {
      collateralToken: `0x${string}`;
      indexToken: `0x${string}`;
      sizeDelta: bigint;
      collateralDelta: bigint;
      isLong: boolean;
      acceptablePrice: bigint;
      slippageBps?: bigint;
    }) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      try {
        const { collateralToken: effectiveCollateral } = getShortPathAndCollateral(
          collateralToken,
          isLong
        );
        const slippedPrice = applySlippage(acceptablePrice, !isLong, slippageBps);
        const isEth = effectiveCollateral.toLowerCase() === contracts.weth.address.toLowerCase();

        // For ETH collateral: use decreasePositionETH so proceeds are unwrapped to native ETH.
        const hash = await writeContractAsync({
          ...contracts.router,
          functionName: isEth ? "decreasePositionETH" : "decreasePosition",
          args: [effectiveCollateral, indexToken, collateralDelta, sizeDelta, isLong, address, slippedPrice],
          gas: isEth ? 800_000n : 600_000n,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Close failed";
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [address, writeContractAsync]
  );

  const placeLimitOrder = useCallback(
    async ({
      collateralToken,
      indexToken,
      collateralAmount,
      sizeDelta,
      isLong,
      triggerPrice,
      triggerAboveThreshold,
    }: PlaceLimitOrderParams) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      try {
        const { path, collateralToken: effectiveCollateral } = getShortPathAndCollateral(
          collateralToken,
          isLong
        );
        // For native ETH collateral the OrderBook needs to wrap the incoming ETH value to WETH.
        const shouldWrap = effectiveCollateral.toLowerCase() === contracts.weth.address.toLowerCase();
        const hash = await writeContractAsync({
          ...contracts.orderBook,
          functionName: "createIncreaseOrder",
          args: [
            path,
            collateralAmount,
            indexToken,
            0n,
            sizeDelta,
            effectiveCollateral,
            isLong,
            triggerPrice,
            triggerAboveThreshold,
            executionFee,
            shouldWrap,
          ],
          value: shouldWrap ? executionFee + collateralAmount : executionFee,
          gas: 600_000n,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Limit order failed";
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [address, executionFee, writeContractAsync]
  );

  const cancelIncreaseOrder = useCallback(
    async (orderIndex: number) => {
      setTxStatus({ state: "pending" });
      try {
        const hash = await writeContractAsync({
          ...contracts.orderBook,
          functionName: "cancelIncreaseOrder",
          args: [BigInt(orderIndex)],
          gas: 200_000n,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Cancel failed";
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [writeContractAsync]
  );

  const cancelDecreaseOrder = useCallback(
    async (orderIndex: number) => {
      setTxStatus({ state: "pending" });
      try {
        const hash = await writeContractAsync({
          ...contracts.orderBook,
          functionName: "cancelDecreaseOrder",
          args: [BigInt(orderIndex)],
          gas: 200_000n,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Cancel failed";
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [writeContractAsync]
  );

  const placeDecreaseOrder = useCallback(
    async ({
      collateralToken,
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      triggerPrice,
      triggerAboveThreshold,
    }: PlaceDecreaseOrderParams) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      try {
        const { collateralToken: effectiveCollateral } = getShortPathAndCollateral(
          collateralToken,
          isLong
        );
        console.log("[placeDecreaseOrder] submitting", {
          address,
          indexToken,
          sizeDelta: sizeDelta.toString(),
          effectiveCollateral,
          collateralDelta: collateralDelta.toString(),
          isLong,
          triggerPrice: triggerPrice.toString(),
          triggerAboveThreshold,
          executionFee: executionFee.toString(),
        });
        const hash = await writeContractAsync({
          ...contracts.orderBook,
          functionName: "createDecreaseOrder",
          args: [
            indexToken,
            sizeDelta,
            effectiveCollateral,
            collateralDelta,
            isLong,
            triggerPrice,
            triggerAboveThreshold,
          ],
          value: executionFee,
          gas: 500_000n,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Decrease order failed";
        console.error("[placeDecreaseOrder] FAILED:", message, err);
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [address, executionFee, writeContractAsync]
  );

  const placeTPSLOrders = useCallback(
    async ({ collateralToken, indexToken, collateralDelta, sizeDelta, isLong, tpPrice, slPrice }: PlaceTPSLOrdersParams) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      const results: (`0x${string}` | null)[] = [];
      const errors: string[] = [];

      try {
        // Take Profit: trigger above threshold for longs, below for shorts
        if (tpPrice) {
          console.log("[placeTPSLOrders] placing TP", { isLong, sizeDelta: sizeDelta.toString(), triggerPrice: tpPrice.toString(), triggerAboveThreshold: isLong });
          const tpHash = await placeDecreaseOrder({
            collateralToken,
            indexToken,
            collateralDelta,
            sizeDelta,
            isLong,
            triggerPrice: tpPrice,
            triggerAboveThreshold: isLong,
          });
          results.push(tpHash);
          if (!tpHash) {
            errors.push("Take Profit order failed");
            console.error("[placeTPSLOrders] TP failed");
          } else {
            console.log("[placeTPSLOrders] TP placed", tpHash);
          }
        }

        // Stop Loss: trigger below threshold for longs, above for shorts
        if (slPrice) {
          console.log("[placeTPSLOrders] placing SL", { isLong, sizeDelta: sizeDelta.toString(), triggerPrice: slPrice.toString(), triggerAboveThreshold: !isLong });
          const slHash = await placeDecreaseOrder({
            collateralToken,
            indexToken,
            collateralDelta,
            sizeDelta,
            isLong,
            triggerPrice: slPrice,
            triggerAboveThreshold: !isLong,
          });
          results.push(slHash);
          if (!slHash) {
            errors.push("Stop Loss order failed");
            console.error("[placeTPSLOrders] SL failed");
          } else {
            console.log("[placeTPSLOrders] SL placed", slHash);
          }
        }

        if (errors.length > 0) {
          setTxStatus({ state: "failed", error: errors.join("; ") });
        } else {
          setTxStatus({ state: "idle" });
        }

        return results;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "TP/SL orders failed";
        console.error("[placeTPSLOrders] unexpected error:", message, err);
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [address, placeDecreaseOrder]
  );

  const resetTxStatus = useCallback(() => {
    setTxStatus({ state: "idle" });
    setPendingHash(undefined);
  }, []);

  return {
    txStatus,
    isPending: txStatus.state === "pending",        // wallet signing — blocks new orders
    isSubmitted: txStatus.state === "submitted",    // on-chain — allow new orders
    isConfirmed: txStatus.state === "confirmed",    // receipt arrived
    routerApproved: !!routerApproved,
    vaultRouterApproved: !!vaultRouterApproved,
    approvePlugin,
    approveVaultRouter,
    approveToken,
    placeMarketOrder,
    closeMarketPosition,
    placeLimitOrder,
    placeDecreaseOrder,
    placeTPSLOrders,
    cancelIncreaseOrder,
    cancelDecreaseOrder,
    resetTxStatus,
    executionFee,
    PRICE_PRECISION,
    formatUnits,
    parseUnits,
  };
}

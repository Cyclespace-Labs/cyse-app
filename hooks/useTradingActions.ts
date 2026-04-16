"use client";

import { useCallback, useState } from "react";
import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { contracts, PRICE_PRECISION } from "@/lib/protocol/contracts";
import { TxStatus } from "@/types/protocol";

const EXECUTION_FEE = parseUnits("0.01", 18);
const SLIPPAGE_BPS = 30n;
const BASIS_POINTS = 10000n;

function applySlippage(price: bigint, isLong: boolean): bigint {
  return isLong
    ? (price * (BASIS_POINTS + SLIPPAGE_BPS)) / BASIS_POINTS
    : (price * (BASIS_POINTS - SLIPPAGE_BPS)) / BASIS_POINTS;
}

export interface PlaceMarketOrderParams {
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  collateralAmount: bigint;
  sizeDelta: bigint;
  isLong: boolean;
  acceptablePrice: bigint;
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

  useWaitForTransactionReceipt({
    hash: pendingHash,
    query: {
      enabled: !!pendingHash,
    },
  });

  const { data: minExecFee } = useReadContract({
    ...contracts.orderBook,
    functionName: "minExecutionFee",
    query: { staleTime: 60_000 },
  });

  const executionFee = (minExecFee as bigint | undefined) ?? EXECUTION_FEE;

  const { data: routerApproved } = useReadContract({
    ...contracts.router,
    functionName: "approvedPlugins",
    args: address ? [address, contracts.positionManager.address] : undefined,
    query: { enabled: !!address },
  });

  const approvePlugin = useCallback(async () => {
    setTxStatus({ state: "pending" });
    try {
      const hash = await writeContractAsync({
        ...contracts.router,
        functionName: "approvePlugin",
        args: [contracts.positionManager.address],
      });
      setPendingHash(hash);
      setTxStatus({ state: "submitted", hash });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Plugin approval failed";
      setTxStatus({ state: "failed", error: message });
    }
  }, [writeContractAsync]);

  const approveToken = useCallback(
    async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      setTxStatus({ state: "pending" });
      try {
        const hash = await writeContractAsync({
          ...contracts.weth,
          address: tokenAddress,
          functionName: "approve",
          args: [spender, amount],
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

  const placeMarketOrder = useCallback(
    async ({
      collateralToken,
      indexToken,
      collateralAmount,
      sizeDelta,
      isLong,
      acceptablePrice,
    }: PlaceMarketOrderParams) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      try {
        const slippedPrice = applySlippage(acceptablePrice, isLong);
        const path: [`0x${string}`] = [collateralToken];

        const hash = await writeContractAsync({
          ...contracts.router,
          functionName: "increasePosition",
          args: [path, indexToken, collateralAmount, 0n, sizeDelta, isLong, slippedPrice],
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Order failed";
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
    }: {
      collateralToken: `0x${string}`;
      indexToken: `0x${string}`;
      sizeDelta: bigint;
      collateralDelta: bigint;
      isLong: boolean;
      acceptablePrice: bigint;
    }) => {
      if (!address) return null;
      setTxStatus({ state: "pending" });
      try {
        const slippedPrice = applySlippage(acceptablePrice, !isLong);
        const hash = await writeContractAsync({
          ...contracts.router,
          functionName: "decreasePosition",
          args: [collateralToken, indexToken, collateralDelta, sizeDelta, isLong, address, slippedPrice],
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
        const path: [`0x${string}`] = [collateralToken];
        const hash = await writeContractAsync({
          ...contracts.orderBook,
          functionName: "createIncreaseOrder",
          args: [
            path,
            collateralAmount,
            indexToken,
            0n,
            sizeDelta,
            collateralToken,
            isLong,
            triggerPrice,
            triggerAboveThreshold,
            executionFee,
            false,
          ],
          value: executionFee,
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
        const hash = await writeContractAsync({
          ...contracts.orderBook,
          functionName: "createDecreaseOrder",
          args: [
            indexToken,
            sizeDelta,
            collateralToken,
            collateralDelta,
            isLong,
            triggerPrice,
            triggerAboveThreshold,
          ],
          value: executionFee,
        });
        setPendingHash(hash);
        setTxStatus({ state: "submitted", hash });
        return hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Decrease order failed";
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
      try {
        const orders: Promise<`0x${string}` | null>[] = [];

        // Take Profit: trigger above threshold for longs, below for shorts
        if (tpPrice) {
          orders.push(
            placeDecreaseOrder({
              collateralToken,
              indexToken,
              collateralDelta,
              sizeDelta,
              isLong,
              triggerPrice: tpPrice,
              triggerAboveThreshold: isLong,
            })
          );
        }

        // Stop Loss: trigger below threshold for longs, above for shorts
        if (slPrice) {
          orders.push(
            placeDecreaseOrder({
              collateralToken,
              indexToken,
              collateralDelta,
              sizeDelta,
              isLong,
              triggerPrice: slPrice,
              triggerAboveThreshold: !isLong,
            })
          );
        }

        const results = await Promise.all(orders);
        const failed = results.some((r) => r === null);

        if (failed) {
          setTxStatus({ state: "failed", error: "Some TP/SL orders failed" });
        } else {
          setTxStatus({ state: "idle" });
        }

        return results;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "TP/SL orders failed";
        setTxStatus({ state: "failed", error: message });
        return null;
      }
    },
    [address, placeDecreaseOrder]
  );

  const resetTxStatus = useCallback(() => setTxStatus({ state: "idle" }), []);

  return {
    txStatus,
    isPending: txStatus.state === "pending" || txStatus.state === "submitted",
    routerApproved: !!routerApproved,
    approvePlugin,
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

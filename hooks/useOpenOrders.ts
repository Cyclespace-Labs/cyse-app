"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";
import { OnChainIncreaseOrder, OnChainDecreaseOrder, OnChainOrder } from "@/types/protocol";
import { useMemo } from "react";
import type { Abi } from "viem";

const MAX_ORDERS = 20;

export function useOpenOrders(indexToken?: `0x${string}`) {
  const { address } = useAccount();

  const { data: increaseIndexRaw, refetch: refetchIncrease } = useReadContract({
    ...contracts.orderBook,
    functionName: "increaseOrdersIndex",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 2_000, staleTime: 500 },
  });

  const { data: decreaseIndexRaw, refetch: refetchDecrease } = useReadContract({
    ...contracts.orderBook,
    functionName: "decreaseOrdersIndex",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 2_000, staleTime: 500 },
  });

  const increaseCount = Math.min(Number(increaseIndexRaw ?? 0n), MAX_ORDERS);
  const decreaseCount = Math.min(Number(decreaseIndexRaw ?? 0n), MAX_ORDERS);

  const increaseContracts = useMemo(
    () =>
      address && increaseCount > 0
        ? Array.from({ length: increaseCount }, (_, i) => ({
            address: contracts.orderBook.address,
            abi: contracts.orderBook.abi as Abi,
            functionName: "getIncreaseOrder" as const,
            args: [address, BigInt(i)] as [`0x${string}`, bigint],
          }))
        : [],
    [address, increaseCount]
  );

  const decreaseContracts = useMemo(
    () =>
      address && decreaseCount > 0
        ? Array.from({ length: decreaseCount }, (_, i) => ({
            address: contracts.orderBook.address,
            abi: contracts.orderBook.abi as Abi,
            functionName: "getDecreaseOrder" as const,
            args: [address, BigInt(i)] as [`0x${string}`, bigint],
          }))
        : [],
    [address, decreaseCount]
  );

  const { data: increaseData, refetch: refetchIncreaseData } = useReadContracts({
    contracts: increaseContracts,
    query: { enabled: increaseContracts.length > 0, refetchInterval: 2_000, staleTime: 500 },
  });

  const { data: decreaseData, refetch: refetchDecreaseData } = useReadContracts({
    contracts: decreaseContracts,
    query: { enabled: decreaseContracts.length > 0, refetchInterval: 2_000, staleTime: 500 },
  });

  const increaseOrders = useMemo((): OnChainIncreaseOrder[] => {
    if (!increaseData) return [];
    return increaseData
      .map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const raw = result.result as readonly unknown[];
        const order: OnChainIncreaseOrder = {
          index: i,
          type: "increase",
          purchaseToken: raw[0] as `0x${string}`,
          purchaseTokenAmount: raw[1] as bigint,
          collateralToken: raw[2] as `0x${string}`,
          indexToken: raw[3] as `0x${string}`,
          sizeDelta: raw[4] as bigint,
          isLong: raw[5] as boolean,
          triggerPrice: raw[6] as bigint,
          triggerAboveThreshold: raw[7] as boolean,
          executionFee: raw[8] as bigint,
        };
        if (order.sizeDelta === 0n) return null;
        if (indexToken && order.indexToken.toLowerCase() !== indexToken.toLowerCase()) return null;
        return order;
      })
      .filter(Boolean) as OnChainIncreaseOrder[];
  }, [increaseData, indexToken]);

  const decreaseOrders = useMemo((): OnChainDecreaseOrder[] => {
    if (!decreaseData) return [];
    return decreaseData
      .map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const raw = result.result as readonly unknown[];
        const order: OnChainDecreaseOrder = {
          index: i,
          type: "decrease",
          collateralToken: raw[0] as `0x${string}`,
          collateralDelta: raw[1] as bigint,
          indexToken: raw[2] as `0x${string}`,
          sizeDelta: raw[3] as bigint,
          isLong: raw[4] as boolean,
          triggerPrice: raw[5] as bigint,
          triggerAboveThreshold: raw[6] as boolean,
          executionFee: raw[7] as bigint,
        };
        if (order.sizeDelta === 0n) return null;
        if (indexToken && order.indexToken.toLowerCase() !== indexToken.toLowerCase()) return null;
        return order;
      })
      .filter(Boolean) as OnChainDecreaseOrder[];
  }, [decreaseData, indexToken]);

  const refetch = () => {
    refetchIncrease();
    refetchDecrease();
    refetchIncreaseData();
    refetchDecreaseData();
  };

  return {
    increaseOrders,
    decreaseOrders,
    allOrders: [...increaseOrders, ...decreaseOrders] as OnChainOrder[],
    refetch,
  };
}

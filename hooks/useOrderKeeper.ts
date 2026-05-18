"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import type { OnChainDecreaseOrder, OnChainIncreaseOrder } from "@/types/protocol";
import { contracts } from "@/lib/protocol/contracts";

interface UseOrderKeeperParams {
  decreaseOrders: OnChainDecreaseOrder[];
  increaseOrders: OnChainIncreaseOrder[];
  minPrice: number | null;
  maxPrice: number | null;
  enabled?: boolean;
}

/**
 * Client-side keeper: monitors oracle prices and executes OrderBook orders
 * directly from the user's wallet (strict, native contract flow).
 *
 * Contract execution logic mirrors OrderBook.sol:
 *   Decrease orders: validatePositionOrderPrice(..., !isLong)
 *     → longs compare against getMinPrice; shorts against getMaxPrice
 *   Increase orders: validatePositionOrderPrice(..., isLong)
 *     → longs compare against getMaxPrice; shorts against getMinPrice
 */
export function useOrderKeeper({
  decreaseOrders,
  increaseOrders,
  minPrice,
  maxPrice,
  enabled = true,
}: UseOrderKeeperParams) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const executing = useRef<Set<string>>(new Set());

  const executeViaWallet = useCallback(
    async (orderType: "decrease" | "increase", orderIndex: number): Promise<string> => {
      if (!address) throw new Error("Wallet not connected");
      const hash = await writeContractAsync({
        ...contracts.orderBook,
        functionName: orderType === "decrease" ? "executeDecreaseOrder" : "executeIncreaseOrder",
        args: [address, BigInt(orderIndex), address],
      });
      return hash;
    },
    [address, writeContractAsync]
  );

  const runKeeperCheck = useCallback(async () => {
    if (!enabled || !address || minPrice === null || maxPrice === null) return;

    // ── Decrease orders (TP / SL) ────────────────────────────────────────────
    // Contract: validatePositionOrderPrice(triggerAboveThreshold, triggerPrice, indexToken, !isLong, true)
    //   _maximizePrice = !isLong  →  longs use getMinPrice; shorts use getMaxPrice
    for (const order of decreaseOrders) {
      if (order.sizeDelta === 0n) continue;
      const key = `dec-${order.index}`;
      if (executing.current.has(key)) continue;

      const currentPrice = order.isLong ? minPrice : maxPrice;
      const triggerPrice = parseFloat(formatUnits(order.triggerPrice, 30));
      const isPriceValid = order.triggerAboveThreshold
        ? currentPrice > triggerPrice
        : currentPrice < triggerPrice;

      if (!isPriceValid) continue;

      console.log(
        `[OrderKeeper] TP/SL triggered — order=${order.index} isLong=${order.isLong} ` +
          `above=${order.triggerAboveThreshold} current=${currentPrice.toFixed(4)} trigger=${triggerPrice.toFixed(4)}`
      );
      executing.current.add(key);
      try {
        const hash = await executeViaWallet("decrease", order.index);
        console.log(`[OrderKeeper] executeDecreaseOrder submitted hash=${hash}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("invalid price for execution") && !msg.includes("non-existent order") && !msg.includes("reverted without a reason string")) {
          console.error(`[OrderKeeper] executeDecreaseOrder failed (order ${order.index}):`, msg);
        }
      } finally {
        executing.current.delete(key);
      }
    }

    // ── Increase orders (Limit orders) ───────────────────────────────────────
    // Contract: validatePositionOrderPrice(triggerAboveThreshold, triggerPrice, indexToken, isLong, true)
    //   _maximizePrice = isLong  →  longs use getMaxPrice; shorts use getMinPrice
    for (const order of increaseOrders) {
      if (order.sizeDelta === 0n) continue;
      const key = `inc-${order.index}`;
      if (executing.current.has(key)) continue;

      const currentPrice = order.isLong ? maxPrice : minPrice;
      const triggerPrice = parseFloat(formatUnits(order.triggerPrice, 30));
      const isPriceValid = order.triggerAboveThreshold
        ? currentPrice > triggerPrice
        : currentPrice < triggerPrice;

      if (!isPriceValid) continue;

      console.log(
        `[OrderKeeper] Limit triggered — order=${order.index} isLong=${order.isLong} ` +
          `above=${order.triggerAboveThreshold} current=${currentPrice.toFixed(4)} trigger=${triggerPrice.toFixed(4)}`
      );
      executing.current.add(key);
      try {
        const hash = await executeViaWallet("increase", order.index);
        console.log(`[OrderKeeper] executeIncreaseOrder submitted hash=${hash}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("invalid price for execution") && !msg.includes("non-existent order") && !msg.includes("VaultPriceFeed: invalid price feed") && !msg.includes("reverted without a reason string")) {
          console.error(`[OrderKeeper] executeIncreaseOrder failed (order ${order.index}):`, msg);
        }
      } finally {
        executing.current.delete(key);
      }
    }
  }, [enabled, address, minPrice, maxPrice, decreaseOrders, increaseOrders, executeViaWallet]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(runKeeperCheck, 2_000);
    return () => clearInterval(id);
  }, [enabled, runKeeperCheck]);
}

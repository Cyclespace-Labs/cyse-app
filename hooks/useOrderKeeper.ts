"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import type { OnChainDecreaseOrder, OnChainIncreaseOrder } from "@/types/protocol";

interface UseOrderKeeperParams {
  decreaseOrders: OnChainDecreaseOrder[];
  increaseOrders: OnChainIncreaseOrder[];
  minPrice: number | null;
  maxPrice: number | null;
  enabled?: boolean;
}

/**
 * Server-side keeper: monitors oracle prices and submits execution
 * transactions via /api/trading/keeper (signed with KEEPER_PRIVATE_KEY).
 * No MetaMask popup — fully automatic once the keeper wallet is funded.
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
  const executing = useRef<Set<string>>(new Set());

  const executeViaKeeper = useCallback(
    async (orderType: "decrease" | "increase", orderIndex: number): Promise<string> => {
      if (!address) throw new Error("Wallet not connected");
      const res = await fetch("/api/trading/keeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderType, account: address, orderIndex }),
      });
      const data = (await res.json()) as { hash?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Keeper execution failed");
      return data.hash ?? "";
    },
    [address]
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
        const hash = await executeViaKeeper("decrease", order.index);
        console.log(`[OrderKeeper] executeDecreaseOrder submitted hash=${hash}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("503") && !msg.includes("not configured")) {
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
        const hash = await executeViaKeeper("increase", order.index);
        console.log(`[OrderKeeper] executeIncreaseOrder submitted hash=${hash}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("503") && !msg.includes("not configured")) {
          console.error(`[OrderKeeper] executeIncreaseOrder failed (order ${order.index}):`, msg);
        }
      } finally {
        executing.current.delete(key);
      }
    }
  }, [enabled, address, minPrice, maxPrice, decreaseOrders, increaseOrders, executeViaKeeper]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(runKeeperCheck, 2_000);
    return () => clearInterval(id);
  }, [enabled, runKeeperCheck]);
}

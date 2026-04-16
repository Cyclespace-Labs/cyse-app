import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { orderBookAbi } from "@/lib/protocol/abis/orderBook.abi";

const ORDER_BOOK = addr["OrderBook"] as `0x${string}`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  const { account } = await params;

  try {
    const [increaseIndexRaw, decreaseIndexRaw] = await Promise.all([
      publicClient.readContract({ address: ORDER_BOOK, abi: orderBookAbi, functionName: "increaseOrdersIndex", args: [account as `0x${string}`] }),
      publicClient.readContract({ address: ORDER_BOOK, abi: orderBookAbi, functionName: "decreaseOrdersIndex", args: [account as `0x${string}`] }),
    ]);

    const increaseCount = Math.min(Number(increaseIndexRaw), 20);
    const decreaseCount = Math.min(Number(decreaseIndexRaw), 20);

    type IncreaseResult = readonly [`0x${string}`, bigint, `0x${string}`, `0x${string}`, bigint, boolean, bigint, boolean, bigint];
    type DecreaseResult = readonly [`0x${string}`, bigint, `0x${string}`, bigint, boolean, bigint, boolean, bigint];

    const increasePromises = Array.from({ length: increaseCount }, (_, i) =>
      publicClient.readContract({
        address: ORDER_BOOK,
        abi: orderBookAbi,
        functionName: "getIncreaseOrder",
        args: [account as `0x${string}`, BigInt(i)],
      }).then((r): [number, IncreaseResult] => [i, r as IncreaseResult]).catch(() => null)
    );

    const decreasePromises = Array.from({ length: decreaseCount }, (_, i) =>
      publicClient.readContract({
        address: ORDER_BOOK,
        abi: orderBookAbi,
        functionName: "getDecreaseOrder",
        args: [account as `0x${string}`, BigInt(i)],
      }).then((r): [number, DecreaseResult] => [i, r as DecreaseResult]).catch(() => null)
    );

    const [increaseRaw, decreaseRaw] = await Promise.all([
      Promise.all(increasePromises),
      Promise.all(decreasePromises),
    ]);

    const increaseOrders = increaseRaw
      .filter(Boolean)
      .map((entry) => {
        if (!entry) return null;
        const [i, r] = entry;
        const sizeDelta = r[4];
        if (sizeDelta === BigInt(0)) return null;
        return {
          index: i,
          type: "increase",
          purchaseToken: r[0],
          purchaseTokenAmount: r[1].toString(),
          collateralToken: r[2],
          indexToken: r[3],
          sizeDelta: sizeDelta.toString(),
          sizeUsd: parseFloat(formatUnits(sizeDelta, 30)),
          isLong: r[5],
          triggerPrice: r[6].toString(),
          triggerPriceFormatted: parseFloat(formatUnits(r[6], 30)),
          triggerAboveThreshold: r[7],
          executionFee: r[8].toString(),
        };
      })
      .filter(Boolean);

    const decreaseOrders = decreaseRaw
      .filter(Boolean)
      .map((entry) => {
        if (!entry) return null;
        const [i, r] = entry;
        const sizeDelta = r[3];
        if (sizeDelta === BigInt(0)) return null;
        return {
          index: i,
          type: "decrease",
          collateralToken: r[0],
          collateralDelta: r[1].toString(),
          indexToken: r[2],
          sizeDelta: sizeDelta.toString(),
          sizeUsd: parseFloat(formatUnits(sizeDelta, 30)),
          isLong: r[4],
          triggerPrice: r[5].toString(),
          triggerPriceFormatted: parseFloat(formatUnits(r[5], 30)),
          triggerAboveThreshold: r[6],
          executionFee: r[7].toString(),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ account, increaseOrders, decreaseOrders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultAbi } from "@/lib/protocol/abis/vault.abi";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0    = Date.now();
  const { account } = await params;
  const { searchParams } = new URL(req.url);
  const collateralToken = searchParams.get("collateralToken");
  const indexToken      = searchParams.get("indexToken");
  const isLong          = searchParams.get("isLong") === "true";

  console.log(`[position][${reqId}] GET account=${account} collateral=${collateralToken} index=${indexToken} isLong=${isLong}`);

  if (!collateralToken || !indexToken) {
    console.warn(`[position][${reqId}] missing required params`);
    return NextResponse.json(
      { error: "collateralToken and indexToken are required" },
      { status: 400 }
    );
  }

  try {
    const position = await publicClient.readContract({
      address: addr["Vault"] as `0x${string}`,
      abi: vaultAbi,
      functionName: "getPosition",
      args: [
        account as `0x${string}`,
        collateralToken as `0x${string}`,
        indexToken as `0x${string}`,
        isLong,
      ],
    });

    const [size, collateral, averagePrice, entryFundingRate, reserveAmount, realisedPnl, hasRealisedProfit, lastIncreasedTime] =
      position as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];

    const sizeUsd = parseFloat(formatUnits(size, 30));
    const collateralUsd = parseFloat(formatUnits(collateral, 30));
    const avgPriceFormatted = parseFloat(formatUnits(averagePrice, 30));
    const hasPosition = size > 0n;

    if (hasPosition) {
      console.log(`[position][${reqId}] OK hasPosition=true sizeUsd=${sizeUsd.toFixed(2)} collateralUsd=${collateralUsd.toFixed(2)} avgPrice=${avgPriceFormatted} latency=${Date.now()-t0}ms`);
    } else {
      console.log(`[position][${reqId}] OK hasPosition=false (no open position) latency=${Date.now()-t0}ms`);
    }

    return NextResponse.json({
      account,
      collateralToken,
      indexToken,
      isLong,
      hasPosition,
      size: size.toString(),
      collateral: collateral.toString(),
      averagePrice: averagePrice.toString(),
      entryFundingRate: entryFundingRate.toString(),
      reserveAmount: reserveAmount.toString(),
      realisedPnl: realisedPnl.toString(),
      hasRealisedProfit,
      lastIncreasedTime: lastIncreasedTime.toString(),
      sizeUsd,
      collateralUsd,
      avgPriceFormatted,
      ts: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch position";
    console.error(`[position][${reqId}] ERR account=${account} latency=${Date.now()-t0}ms`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

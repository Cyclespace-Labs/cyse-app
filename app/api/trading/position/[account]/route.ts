import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultAbi } from "@/lib/protocol/abis/vault.abi";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  const { account } = await params;
  const { searchParams } = new URL(req.url);
  const collateralToken = searchParams.get("collateralToken");
  const indexToken = searchParams.get("indexToken");
  const isLong = searchParams.get("isLong") === "true";

  if (!collateralToken || !indexToken) {
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

    return NextResponse.json({
      account,
      collateralToken,
      indexToken,
      isLong,
      size: size.toString(),
      collateral: collateral.toString(),
      averagePrice: averagePrice.toString(),
      entryFundingRate: entryFundingRate.toString(),
      reserveAmount: reserveAmount.toString(),
      realisedPnl: realisedPnl.toString(),
      hasRealisedProfit,
      lastIncreasedTime: lastIncreasedTime.toString(),
      sizeUsd: parseFloat(formatUnits(size, 30)),
      collateralUsd: parseFloat(formatUnits(collateral, 30)),
      avgPriceFormatted: parseFloat(formatUnits(averagePrice, 30)),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch position";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

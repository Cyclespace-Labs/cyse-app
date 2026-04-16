import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultPriceFeedAbi } from "@/lib/protocol/abis/vaultPriceFeed.abi";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token address is required" }, { status: 400 });
  }

  try {
    const priceRaw = await publicClient.readContract({
      address: addr["VaultPriceFeed"] as `0x${string}`,
      abi: vaultPriceFeedAbi,
      functionName: "getPrice",
      args: [token as `0x${string}`, false, true, false],
    });

    const price = parseFloat(formatUnits(priceRaw as bigint, 30));

    return NextResponse.json({ token, price, priceRaw: (priceRaw as bigint).toString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch price";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

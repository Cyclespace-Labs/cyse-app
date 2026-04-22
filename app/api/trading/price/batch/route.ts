import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultPriceFeedAbi } from "@/lib/protocol/abis/vaultPriceFeed.abi";
import { vaultAbi } from "@/lib/protocol/abis/vault.abi";

const PRICE_FEED = addr["VaultPriceFeed"] as `0x${string}`;
const VAULT      = addr["Vault"]          as `0x${string}`;

// GET /api/trading/price/batch?tokens=0xABC,0xDEF
export async function GET(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0    = Date.now();
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get("tokens") ?? "";
  const tokens = tokenParam.split(",").map((t) => t.trim()).filter(Boolean);

  console.log(`[price/batch][${reqId}] GET tokens=${tokens.join(",")} count=${tokens.length}`);

  if (tokens.length === 0) {
    console.warn(`[price/batch][${reqId}] no tokens provided`);
    return NextResponse.json({ error: "tokens param is required (comma-separated addresses)" }, { status: 400 });
  }

  if (tokens.length > 10) {
    console.warn(`[price/batch][${reqId}] too many tokens: ${tokens.length}`);
    return NextResponse.json({ error: "max 10 tokens per batch request" }, { status: 400 });
  }

  try {
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const tToken = Date.now();
        const [priceRaw, minPriceRaw, maxPriceRaw] = await Promise.all([
          publicClient.readContract({
            address: PRICE_FEED,
            abi: vaultPriceFeedAbi,
            functionName: "getPrice",
            args: [token as `0x${string}`, true, true, false],
          }),
          publicClient.readContract({
            address: VAULT,
            abi: vaultAbi,
            functionName: "getMinPrice",
            args: [token as `0x${string}`],
          }),
          publicClient.readContract({
            address: VAULT,
            abi: vaultAbi,
            functionName: "getMaxPrice",
            args: [token as `0x${string}`],
          }),
        ]);

        const price    = parseFloat(formatUnits(priceRaw as bigint, 30));
        const minPrice = parseFloat(formatUnits(minPriceRaw as bigint, 30));
        const maxPrice = parseFloat(formatUnits(maxPriceRaw as bigint, 30));
        const spread   = parseFloat((maxPrice - minPrice).toFixed(6));

        console.log(`[price/batch][${reqId}] token=${token} price=${price} spread=${spread} latency=${Date.now()-tToken}ms`);

        return {
          token,
          price,
          minPrice,
          maxPrice,
          spread,
          priceRaw:    (priceRaw as bigint).toString(),
          minPriceRaw: (minPriceRaw as bigint).toString(),
          maxPriceRaw: (maxPriceRaw as bigint).toString(),
        };
      })
    );

    const prices: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    results.forEach((res, i) => {
      if (res.status === "fulfilled") {
        prices[tokens[i]] = res.value;
      } else {
        const msg = res.reason instanceof Error ? res.reason.message : "unknown error";
        errors[tokens[i]] = msg;
        console.error(`[price/batch][${reqId}] token=${tokens[i]} ERR: ${msg}`);
      }
    });

    console.log(`[price/batch][${reqId}] DONE ok=${Object.keys(prices).length} err=${Object.keys(errors).length} latency=${Date.now()-t0}ms`);

    return NextResponse.json({
      prices,
      ...(Object.keys(errors).length > 0 && { errors }),
      ts: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch batch prices";
    console.error(`[price/batch][${reqId}] FATAL latency=${Date.now()-t0}ms`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

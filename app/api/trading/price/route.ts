import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultPriceFeedAbi } from "@/lib/protocol/abis/vaultPriceFeed.abi";
import { vaultAbi } from "@/lib/protocol/abis/vault.abi";
import { HermesClient } from "@pythnetwork/hermes-client";
import { HERMES_BASE_URL, getPythFeedId, feedIdToPair } from "@/lib/pyth/config";

const PRICE_FEED = addr["VaultPriceFeed"] as `0x${string}`;
const VAULT      = addr["Vault"]          as `0x${string}`;
const hermes     = new HermesClient(HERMES_BASE_URL);

interface HermesParsedFeed {
  id: string;
  price: { price: string; conf: string; expo: number; publish_time: number };
  ema_price: { price: string; conf: string; expo: number; publish_time: number };
}

export async function GET(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0    = Date.now();
  const { searchParams } = new URL(req.url);
  const token    = searchParams.get("token");
  const maximise = searchParams.get("maximise") !== "false";

  console.log(`[price][${reqId}] GET token=${token} maximise=${maximise}`);

  if (!token) {
    console.warn(`[price][${reqId}] missing token param`);
    return NextResponse.json({ error: "token address is required" }, { status: 400 });
  }

  // Resolve Pyth feed ID for this token (may be null if unknown token)
  const pythFeedId = getPythFeedId(token);

  try {
    // Fetch on-chain price + Pyth Hermes price in parallel
    const [priceRaw, minPriceRaw, maxPriceRaw, pythResult] = await Promise.all([
      publicClient.readContract({
        address: PRICE_FEED,
        abi: vaultPriceFeedAbi,
        functionName: "getPrice",
        args: [token as `0x${string}`, maximise, true, false],
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
      pythFeedId ? hermes.getLatestPriceUpdates([pythFeedId]).catch((e: unknown) => {
        console.warn(`[price][${reqId}] Pyth fetch failed:`, e);
        return null;
      }) : Promise.resolve(null),
    ]);

    const price    = parseFloat(formatUnits(priceRaw as bigint, 30));
    const minPrice = parseFloat(formatUnits(minPriceRaw as bigint, 30));
    const maxPrice = parseFloat(formatUnits(maxPriceRaw as bigint, 30));
    const spread   = parseFloat((maxPrice - minPrice).toFixed(6));

    // Parse Pyth result
    let pyth: { price: number; confidence: number; emaPrice: number; publishTime: number; pair: string } | null = null;
    if (pythResult) {
      const parsed = (pythResult.parsed ?? []) as unknown as HermesParsedFeed[];
      if (parsed.length > 0) {
        const feed   = parsed[0];
        const expo   = feed.price.expo;
        const factor = Math.pow(10, expo);
        const id     = feed.id.startsWith("0x") ? feed.id : `0x${feed.id}`;
        pyth = {
          price:       Number(feed.price.price) * factor,
          confidence:  Number(feed.price.conf) * factor,
          emaPrice:    Number(feed.ema_price.price) * factor,
          publishTime: feed.price.publish_time,
          pair:        feedIdToPair(id) ?? id.slice(0, 10),
        };
      }
    }

    const devPct = pyth && price > 0
      ? parseFloat((Math.abs(pyth.price - price) / price * 100).toFixed(4))
      : null;

    console.log(
      `[price][${reqId}] OK token=${token} vault=$${price.toFixed(4)} pyth=$${pyth?.price.toFixed(4) ?? "n/a"} dev=${devPct ?? "n/a"}% spread=${spread} latency=${Date.now()-t0}ms`
    );

    return NextResponse.json({
      token,
      price,
      minPrice,
      maxPrice,
      spread,
      priceRaw:    (priceRaw as bigint).toString(),
      minPriceRaw: (minPriceRaw as bigint).toString(),
      maxPriceRaw: (maxPriceRaw as bigint).toString(),
      pyth,
      deviationPct: devPct,
      ts: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch price";
    console.error(`[price][${reqId}] ERR token=${token} latency=${Date.now()-t0}ms`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/pyth/prices?ids=0xFEED1,0xFEED2
 * GET /api/pyth/prices                       (fetches all default feeds)
 *
 * Server-side Pyth price fetcher using @pythnetwork/hermes-client.
 * Returns latest parsed prices from Hermes + hex VAA update data for
 * on-chain submission to MockPyth.updatePriceFeeds().
 */
import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { HermesClient } from "@pythnetwork/hermes-client";
import { HERMES_BASE_URL, PYTH_FEED_IDS, feedIdToPair } from "@/lib/pyth/config";

interface HermesPriceFeed {
  id: string;
  price: { price: string; conf: string; expo: number; publish_time: number };
  ema_price: { price: string; conf: string; expo: number; publish_time: number };
}

const hermes = new HermesClient(HERMES_BASE_URL);

export async function GET(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0    = Date.now();

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const feedIds  = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : Object.values(PYTH_FEED_IDS);

  console.log(`[pyth/prices][${reqId}] GET feeds=${feedIds.length}`);

  try {
    const result = await hermes.getLatestPriceUpdates(feedIds);

    const parsed = (result?.parsed ?? []) as unknown as HermesPriceFeed[];
    if (!parsed.length) {
      console.warn(`[pyth/prices][${reqId}] no parsed prices returned`);
      return NextResponse.json({ error: "No price data from Hermes" }, { status: 502 });
    }

    const prices = parsed.map((feed: HermesPriceFeed) => {
      const id     = feed.id.startsWith("0x") ? feed.id : `0x${feed.id}`;
      const pair   = feedIdToPair(id) ?? id.slice(0, 10);
      const expo   = feed.price.expo;
      const factor = Math.pow(10, expo);
      const price  = Number(feed.price.price) * factor;
      const conf   = Number(feed.price.conf) * factor;
      const ema    = Number(feed.ema_price.price) * factor;

      console.log(`[pyth/prices][${reqId}] ${pair}: $${price.toFixed(4)} ±${conf.toFixed(4)} ema=$${ema.toFixed(4)} t=${feed.price.publish_time}`);

      return {
        pair,
        feedId: id,
        price,
        confidence: conf,
        emaPrice: ema,
        publishTime: feed.price.publish_time,
        priceRaw: feed.price.price,
        exponent: expo,
      };
    });

    // Include binary update data (hex VAA) for on-chain submission
    const resultAny = result as Record<string, unknown>;
    const updateData = (resultAny?.binary as { data?: string[] })?.data ?? [];

    console.log(`[pyth/prices][${reqId}] OK feeds=${prices.length} latency=${Date.now() - t0}ms`);

    return NextResponse.json({
      prices,
      updateData,
      ts: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Pyth prices";
    console.error(`[pyth/prices][${reqId}] ERR latency=${Date.now() - t0}ms`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

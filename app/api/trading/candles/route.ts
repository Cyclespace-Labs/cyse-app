import { NextRequest, NextResponse } from "next/server";

// ── Symbol → Binance pair mapping ───────────────────────────────────────────
const BINANCE_PAIRS: Record<string, string> = {
  ETH:   "ETHUSDT",
  BTC:   "BTCUSDT",
  BNB:   "BNBUSDT",
  SOL:   "SOLUSDT",
  DOGE:  "DOGEUSDT",
  ARB:   "ARBUSDT",
  OP:    "OPUSDT",
  PENGU: "PENGUUSDT",
  XRP:   "XRPUSDT",
  LINK:  "LINKUSDT",
  AVAX:  "AVAXUSDT",
  SUI:   "SUIUSDT",
  APT:   "APTUSDT",
  SEI:   "SEIUSDT",
  WIF:   "WIFUSDT",
  BONK:  "BONKUSDT",
  HYPE:  "HYPEUSDT",
  JUP:   "JUPUSDT",
  USDT:  "USDCUSDT",  // stablecoin fallback
};

// Binance-supported kline intervals
const VALID_INTERVALS = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"];

// Default candle counts per interval (maximised for full chart history)
const DEFAULT_LIMITS: Record<string, number> = {
  "1m": 1000, "3m": 1000, "5m": 1000, "15m": 750, "30m": 750,
  "1h": 750, "2h": 500, "4h": 500, "6h": 500,
  "1d": 500, "1w": 200, "1M": 60,
};

/**
 * GET /api/trading/candles?symbol=ETH&interval=1m&limit=500&startTime=...&endTime=...
 *
 * Proxies Binance public kline API. No API key required.
 * Supports pagination via startTime/endTime (unix ms).
 * Supports multi-page fetching for limits > 1000.
 *
 * Returns: { candles: Array<{ time, open, high, low, close, volume }>, count, symbol, interval, ts }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol    = (searchParams.get("symbol") ?? "ETH").toUpperCase();
  const interval  = searchParams.get("interval") ?? "1m";
  const startTime = searchParams.get("startTime");   // unix ms
  const endTime   = searchParams.get("endTime");     // unix ms
  const rawLimit  = Number(searchParams.get("limit") || DEFAULT_LIMITS[interval] || 500);
  const limit     = Math.min(Math.max(rawLimit, 1), 1500); // cap at 1500 (multi-page)

  const pair = BINANCE_PAIRS[symbol];
  if (!pair) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
  }
  if (!VALID_INTERVALS.includes(interval)) {
    return NextResponse.json({ error: `Invalid interval: ${interval}` }, { status: 400 });
  }

  try {
    // Binance allows max 1000 per request. If limit > 1000, do multi-page.
    const allCandles: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
    let remaining = limit;
    let cursor = endTime ? Number(endTime) : undefined;

    while (remaining > 0) {
      const pageLimit = Math.min(remaining, 1000);
      let url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${pageLimit}`;
      if (startTime && !cursor) url += `&startTime=${startTime}`;
      if (cursor) url += `&endTime=${cursor}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        console.error("[candles] Binance error:", res.status, text);
        return NextResponse.json({ error: "Binance API error", detail: text }, { status: 502 });
      }

      const raw: unknown[][] = await res.json();
      if (raw.length === 0) break;

      const page = raw.map((k) => ({
        time:   Math.floor((k[0] as number) / 1000),
        open:   parseFloat(k[1] as string),
        high:   parseFloat(k[2] as string),
        low:    parseFloat(k[3] as string),
        close:  parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      }));

      // For backward pagination: prepend older candles
      if (cursor) {
        allCandles.unshift(...page);
        // Move cursor to before the oldest candle in this page
        cursor = (raw[0][0] as number) - 1;
      } else {
        allCandles.push(...page);
      }

      remaining -= page.length;

      // If we got fewer than requested, we've reached the end of history
      if (page.length < pageLimit) break;
    }

    // Deduplicate by time (in case of overlapping pages)
    const seen = new Set<number>();
    const candles = allCandles.filter((c) => {
      if (seen.has(c.time)) return false;
      seen.add(c.time);
      return true;
    });

    // Sort by time ascending
    candles.sort((a, b) => a.time - b.time);

    const response = NextResponse.json({
      candles,
      count: candles.length,
      symbol,
      interval,
      ts: Date.now(),
    });

    // Cache for 5s on CDN, serve stale for 25s while revalidating
    response.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=25");

    return response;
  } catch (err) {
    console.error("[candles] fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch candle data" }, { status: 500 });
  }
}

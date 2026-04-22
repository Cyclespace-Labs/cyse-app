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

/**
 * GET /api/trading/candles?symbol=ETH&interval=1m&limit=300
 *
 * Proxies Binance public kline API. No API key required.
 * Returns: { candles: Array<{ time, open, high, low, close, volume }> }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol   = (searchParams.get("symbol") ?? "ETH").toUpperCase();
  const interval = searchParams.get("interval") ?? "1m";
  const limit    = Math.min(Number(searchParams.get("limit") ?? 300), 1000);

  const pair = BINANCE_PAIRS[symbol];
  if (!pair) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
  }
  if (!VALID_INTERVALS.includes(interval)) {
    return NextResponse.json({ error: `Invalid interval: ${interval}` }, { status: 400 });
  }

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 5 } }); // cache 5s server-side
    if (!res.ok) {
      const text = await res.text();
      console.error("[candles] Binance error:", res.status, text);
      return NextResponse.json({ error: "Binance API error", detail: text }, { status: 502 });
    }

    const raw: unknown[][] = await res.json();

    const candles = raw.map((k) => ({
      time:   Math.floor((k[0] as number) / 1000),        // open time → unix seconds
      open:   parseFloat(k[1] as string),
      high:   parseFloat(k[2] as string),
      low:    parseFloat(k[3] as string),
      close:  parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
    }));

    return NextResponse.json({ candles, symbol, interval, ts: Date.now() });
  } catch (err) {
    console.error("[candles] fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch candle data" }, { status: 500 });
  }
}

/**
 * GET /api/trading/orderbook?token=0x...&levels=14
 *
 * Builds a realistic order-book depth snapshot from on-chain Vault data:
 *   - Mid price from VaultPriceFeed (getPrice)
 *   - Spread from Vault getMinPrice / getMaxPrice
 *   - Depth from poolAmounts, reservedAmounts, globalShortSizes
 *
 * ABI references:
 *   VaultPriceFeed.getPrice(token, maximise, includeAmmPrice, useSwapPricing) → uint256 (1e30)
 *   Vault.getMinPrice(token) → uint256 (1e30)
 *   Vault.getMaxPrice(token) → uint256 (1e30)
 *   Vault.poolAmounts(token) → uint256 (token decimals)
 *   Vault.reservedAmounts(token) → uint256 (token decimals)
 *   Vault.globalShortSizes(token) → uint256 (1e30 USD)
 */
import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultPriceFeedAbi } from "@/lib/protocol/abis/vaultPriceFeed.abi";
import { vaultAbi } from "@/lib/protocol/abis/vault.abi";

const PRICE_FEED = addr["VaultPriceFeed"] as `0x${string}`;
const VAULT      = addr["Vault"]          as `0x${string}`;

// Spread reduction factor for realistic orderbook display
// The on-chain spread (maxPrice - minPrice) is accurate for contract execution
// but appears wide in the UI. This factor reduces the displayed spread while
// keeping contract-accurate prices for actual order execution.
const SPREAD_REDUCTION_FACTOR = 0.3; // Display 30% of actual on-chain spread

// Token decimal map — WETH 18, BTC 8, USDC/USDT 6
const TOKEN_DECIMALS: Record<string, number> = {
  [addr["WETH"]?.toLowerCase() ?? ""]: 18,
  [addr["BTC"]?.toLowerCase()  ?? ""]: 8,
  [addr["USDC"]?.toLowerCase() ?? ""]: 6,
  [addr["USDT"]?.toLowerCase() ?? ""]: 6,
};
const DEFAULT_DECIMALS = 18;

interface OrderBookLevel {
  price: number;
  size:  number;
  total: number;
}

function seededRng(seed: number) {
  let s = ((seed * 1664525 + 1013904223) >>> 0);
  return () => {
    s = ((s * 1664525 + 1013904223) >>> 0);
    return s / 0xffffffff;
  };
}

export async function GET(req: NextRequest) {
  const reqId  = Math.random().toString(36).slice(2, 8);
  const t0     = Date.now();
  const { searchParams } = new URL(req.url);
  const token  = searchParams.get("token");
  const levels = Math.min(parseInt(searchParams.get("levels") ?? "14", 10), 30);

  console.log(`[orderbook][${reqId}] GET token=${token} levels=${levels}`);

  if (!token) {
    console.warn(`[orderbook][${reqId}] missing token param`);
    return NextResponse.json({ error: "token address is required" }, { status: 400 });
  }

  try {
    const tokenKey = token.toLowerCase();
    const tokenDecimals = TOKEN_DECIMALS[tokenKey] ?? DEFAULT_DECIMALS;

    // Fetch all vault data in parallel — matches vault.abi.ts function signatures exactly
    const [midPriceRaw, minPriceRaw, maxPriceRaw, poolAmtRaw, reservedAmtRaw, shortSizeRaw] =
      await Promise.all([
        publicClient.readContract({
          address: PRICE_FEED,
          abi: vaultPriceFeedAbi,
          functionName: "getPrice",
          args: [token as `0x${string}`, false, true, false], // maximise=false → mid price
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
        publicClient.readContract({
          address: VAULT,
          abi: vaultAbi,
          functionName: "poolAmounts",
          args: [token as `0x${string}`],
        }),
        publicClient.readContract({
          address: VAULT,
          abi: vaultAbi,
          functionName: "reservedAmounts",
          args: [token as `0x${string}`],
        }),
        publicClient.readContract({
          address: VAULT,
          abi: vaultAbi,
          functionName: "globalShortSizes",
          args: [token as `0x${string}`],
        }),
      ]);

    const midPrice   = parseFloat(formatUnits(midPriceRaw as bigint, 30));
    const minPrice   = parseFloat(formatUnits(minPriceRaw as bigint, 30));
    const maxPrice   = parseFloat(formatUnits(maxPriceRaw as bigint, 30));
    const poolTokens = parseFloat(formatUnits(poolAmtRaw as bigint, tokenDecimals));
    const reserved   = parseFloat(formatUnits(reservedAmtRaw as bigint, tokenDecimals));
    const shortUsd   = parseFloat(formatUnits(shortSizeRaw as bigint, 30));

    // Available liquidity (tokens not reserved for open positions)
    const availableTokens = Math.max(poolTokens - reserved, 0);
    const availableUsd    = availableTokens * midPrice;
    const longOIUsd       = reserved * midPrice; // proxy: reserved ≈ long OI collateral backing

    console.log(`[orderbook][${reqId}] vault data: midPrice=${midPrice} min=${minPrice} max=${maxPrice} pool=${poolTokens.toFixed(4)} reserved=${reserved.toFixed(4)} available=${availableTokens.toFixed(4)} shortOI_usd=${shortUsd.toFixed(2)} latency=${Date.now()-t0}ms`);

    // On-chain spread: maxPrice - minPrice (contract-accurate for execution)
    const onChainSpread = parseFloat((maxPrice - minPrice).toFixed(8));
    
    // Display spread with reduction factor for realistic UI
    const spread = parseFloat((onChainSpread * SPREAD_REDUCTION_FACTOR).toFixed(8));
    
    // Adjusted bid/ask for display (tighter spread)
    const midPoint = (maxPrice + minPrice) / 2;
    const bestAsk  = midPoint + (spread / 2);  // vault sells at adjusted max
    const bestBid  = midPoint - (spread / 2);  // vault buys at adjusted min

    // Determine tick size from price magnitude
    function getTickSize(p: number): number {
      if (p >= 10_000) return 1;
      if (p >= 1_000)  return 0.1;
      if (p >= 100)    return 0.01;
      if (p >= 10)     return 0.001;
      return 0.0001;
    }
    const tick = getTickSize(midPrice);
    const priceDecimals = Math.max(2, -Math.floor(Math.log10(tick)));

    // Use vault liquidity to weight depth levels realistically
    // Total bid-side depth = availableUsd (pool available for longs)
    // Total ask-side depth = shortUsd + availableUsd (vault can absorb new shorts)
    const bidDepthUsd = availableUsd > 0 ? availableUsd : midPrice * 500;
    const askDepthUsd = shortUsd > 0 ? shortUsd + availableUsd : midPrice * 500;

    // Seeded RNG for stable (non-flickering) level sizes
    const seed = Math.round(midPrice / tick);
    const rng  = seededRng(seed);

    // Generate ask levels (lowest to highest, then reverse for display)
    const rawAsks: Array<{ price: number; size: number }> = Array.from({ length: levels }, (_, i) => {
      const levelPrice = parseFloat((bestAsk + i * tick).toFixed(priceDecimals));
      // Depth tapers off as price moves away from mid
      const weight    = 1 / (1 + i * 0.15);
      const levelUsd  = (askDepthUsd / levels) * weight * (0.7 + rng() * 0.6);
      const size      = parseFloat((levelUsd / levelPrice).toFixed(4));
      return { price: levelPrice, size };
    });

    // Display asks: highest at top, lowest at bottom; cumulate top→bottom
    let runningAsk = 0;
    const asks: OrderBookLevel[] = rawAsks.slice().reverse().map((o) => {
      runningAsk += o.size;
      return { price: o.price, size: o.size, total: parseFloat(runningAsk.toFixed(4)) };
    });

    // Generate bid levels (highest to lowest)
    let runningBid = 0;
    const bids: OrderBookLevel[] = Array.from({ length: levels }, (_, i) => {
      const levelPrice = parseFloat((bestBid - i * tick).toFixed(priceDecimals));
      const weight     = 1 / (1 + i * 0.15);
      const levelUsd   = (bidDepthUsd / levels) * weight * (0.7 + rng() * 0.6);
      const size       = parseFloat((levelUsd / levelPrice).toFixed(4));
      runningBid += size;
      return { price: levelPrice, size, total: parseFloat(runningBid.toFixed(4)) };
    });

    const totalAll = runningAsk + runningBid;
    const bidPct   = totalAll > 0 ? Math.round((runningBid / totalAll) * 100) : 50;

    console.log(`[orderbook][${reqId}] OK asks=${asks.length} bids=${bids.length} spread=${spread} bidDepthUsd=${bidDepthUsd.toFixed(0)} askDepthUsd=${askDepthUsd.toFixed(0)} latency=${Date.now()-t0}ms`);

    return NextResponse.json({
      token,
      midPrice,
      minPrice,
      maxPrice,
      spread,
      bestBid,
      bestAsk,
      asks,
      bids,
      bidPct,
      askPct: 100 - bidPct,
      meta: {
        poolTokens,
        reservedTokens: reserved,
        availableTokens,
        longOIUsd,
        shortOIUsd: shortUsd,
      },
      ts: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to build order book";
    console.error(`[orderbook][${reqId}] ERR token=${token} latency=${Date.now()-t0}ms`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

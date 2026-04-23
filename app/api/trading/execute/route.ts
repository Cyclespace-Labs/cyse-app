/**
 * POST /api/trading/execute
 *
 * Server-side order parameter validation and computation.
 * Validates the order, fetches current oracle price, and returns the exact
 * contract call parameters the client must use when signing the transaction.
 *
 * ABI references:
 *   VaultPriceFeed.getPrice(token, maximise, includeAmmPrice, useSwapPricing) → uint256 (1e30)
 *   OrderBook.minExecutionFee() → uint256 (wei)
 *   Vault.getPosition(account, collateralToken, indexToken, isLong) →
 *     (size, collateral, averagePrice, entryFundingRate, reserveAmount, realisedPnl, hasProfit, lastIncreasedTime)
 *   Router.increasePositionETH(path[], indexToken, minOut, sizeDelta, isLong, acceptablePrice) payable
 *   Router.increasePosition(path[], indexToken, amountIn, minOut, sizeDelta, isLong, acceptablePrice)
 *   OrderBook.createIncreaseOrder(path[], amountIn, indexToken, minOut, sizeDelta, collateralToken,
 *     isLong, triggerPrice, triggerAboveThreshold, executionFee, shouldWrap) payable
 *   OrderBook.createDecreaseOrder(indexToken, sizeDelta, collateralToken, collateralDelta,
 *     isLong, triggerPrice, triggerAboveThreshold) payable
 */
import { NextRequest, NextResponse } from "next/server";
import { formatUnits, parseUnits, isAddress } from "viem";
import { publicClient, addr } from "@/lib/protocol/client";
import { vaultPriceFeedAbi } from "@/lib/protocol/abis/vaultPriceFeed.abi";
import { vaultAbi } from "@/lib/protocol/abis/vault.abi";
import { orderBookAbi } from "@/lib/protocol/abis/orderBook.abi";

const PRICE_FEED  = addr["VaultPriceFeed"] as `0x${string}`;
const VAULT       = addr["Vault"]          as `0x${string}`;
const ORDER_BOOK  = addr["OrderBook"]      as `0x${string}`;
const WETH        = addr["WETH"]           as `0x${string}`;
const USDC        = addr["USDC"]           as `0x${string}`;
const USDT        = addr["USDT"]           as `0x${string}`;
const BTC         = addr["BTC"]            as `0x${string}`;

const BASIS_POINTS = 10_000n;
const PRICE_DECIMALS = 30;

// Token decimals mapping
const TOKEN_DECIMALS: Record<string, number> = {
  [WETH.toLowerCase()]: 18,
  [USDC.toLowerCase()]: 6,
  [USDT.toLowerCase()]: 6,
  [BTC.toLowerCase()]: 8,
};

function getTokenDecimals(tokenAddress: string): number {
  return TOKEN_DECIMALS[tokenAddress.toLowerCase()] ?? 18; // Default to 18 decimals
}

function applySlippage(priceRaw: bigint, isLong: boolean, slippageBps: bigint): bigint {
  return isLong
    ? (priceRaw * (BASIS_POINTS + slippageBps)) / BASIS_POINTS
    : (priceRaw * (BASIS_POINTS - slippageBps)) / BASIS_POINTS;
}

export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0    = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const {
    orderType,        // "market" | "limit" | "decrease"
    account,
    collateralToken,
    indexToken,
    isLong,
    quantityEth,      // collateral amount as string (token units, e.g. "0.1")
    leverageX,        // number, e.g. 10
    limitPrice,       // string, USD for limit/decrease orders
    slippageBps: slippageBpsRaw = 30,
    tpPrice,          // optional string
    slPriceVal,       // optional string
    collateralDecimals: collateralDecimalsParam, // optional number, defaults to 18
  } = body as {
    orderType: string;
    account: string;
    collateralToken: string;
    indexToken: string;
    isLong: boolean;
    quantityEth: string;
    leverageX: number;
    limitPrice?: string;
    slippageBps?: number;
    tpPrice?: string;
    slPriceVal?: string;
    collateralDecimals?: number;
  };

  console.log(`[execute][${reqId}] POST orderType=${orderType} account=${account} indexToken=${indexToken} isLong=${isLong} qty=${quantityEth} leverage=${leverageX}x slippage=${slippageBpsRaw}bps`);

  // ── Input validation ────────────────────────────────────────────────────────
  const validationErrors: string[] = [];
  if (!["market", "limit", "decrease"].includes(orderType))
    validationErrors.push(`unknown orderType: ${orderType}`);
  if (!account || !isAddress(account))
    validationErrors.push("account must be a valid address");
  if (!collateralToken || !isAddress(collateralToken))
    validationErrors.push("collateralToken must be a valid address");
  if (!indexToken || !isAddress(indexToken))
    validationErrors.push("indexToken must be a valid address");
  if (typeof isLong !== "boolean")
    validationErrors.push("isLong must be boolean");

  // Validate collateral token is in our supported list
  const decimals = collateralDecimalsParam ?? getTokenDecimals(collateralToken);
  if (!TOKEN_DECIMALS[collateralToken.toLowerCase()]) {
    validationErrors.push(`unsupported collateral token: ${collateralToken}`);
  }

  const qtyNum = parseFloat(quantityEth ?? "0");
  if (!quantityEth || isNaN(qtyNum) || qtyNum <= 0)
    validationErrors.push("quantityEth must be a positive number string");

  const levNum = Number(leverageX);
  if (!leverageX || isNaN(levNum) || levNum < 1 || levNum > 100)
    validationErrors.push("leverageX must be between 1 and 100");

  if (validationErrors.length > 0) {
    console.warn(`[execute][${reqId}] validation failed: ${validationErrors.join(", ")}`);
    return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 });
  }

  const slippageBps = BigInt(Math.round(Number(slippageBpsRaw)));

  try {
    // ── Fetch oracle price + minExecutionFee in parallel ──────────────────────
    const [priceRaw, minPriceRaw, maxPriceRaw, minExecFeeRaw] = await Promise.all([
      publicClient.readContract({
        address: PRICE_FEED,
        abi: vaultPriceFeedAbi,
        functionName: "getPrice",
        args: [indexToken as `0x${string}`, isLong, true, false], // maximise=isLong for acceptable price
      }),
      publicClient.readContract({
        address: VAULT,
        abi: vaultAbi,
        functionName: "getMinPrice",
        args: [indexToken as `0x${string}`],
      }),
      publicClient.readContract({
        address: VAULT,
        abi: vaultAbi,
        functionName: "getMaxPrice",
        args: [indexToken as `0x${string}`],
      }),
      publicClient.readContract({
        address: ORDER_BOOK,
        abi: orderBookAbi,
        functionName: "minExecutionFee",
      }),
    ]);

    const oraclePrice  = parseFloat(formatUnits(priceRaw as bigint, PRICE_DECIMALS));
    const minPriceFmt  = parseFloat(formatUnits(minPriceRaw as bigint, PRICE_DECIMALS));
    const maxPriceFmt  = parseFloat(formatUnits(maxPriceRaw as bigint, PRICE_DECIMALS));
    const executionFee = minExecFeeRaw as bigint;

    console.log(`[execute][${reqId}] oracle price=${oraclePrice} min=${minPriceFmt} max=${maxPriceFmt} execFee=${formatUnits(executionFee, 18)} ETH`);

    // ── Limit-price validation ────────────────────────────────────────────────
    let limitPriceRaw: bigint | null = null;
    if (orderType === "limit" || orderType === "decrease") {
      if (!limitPrice || isNaN(parseFloat(limitPrice))) {
        return NextResponse.json({ error: "limitPrice required for limit/decrease orders" }, { status: 400 });
      }
      const limitPriceNum = parseFloat(limitPrice);
      limitPriceRaw = parseUnits(limitPriceNum.toFixed(8), PRICE_DECIMALS);

      // Sanity: limit price should be within 50% of oracle price
      const deviation = Math.abs((limitPriceNum - oraclePrice) / oraclePrice) * 100;
      if (deviation > 50) {
        console.warn(`[execute][${reqId}] limit price deviation too large: ${deviation.toFixed(1)}%`);
        return NextResponse.json({
          error: `Limit price ${limitPrice} deviates ${deviation.toFixed(1)}% from oracle ${oraclePrice.toFixed(2)}. Max allowed: 50%`,
        }, { status: 400 });
      }
      console.log(`[execute][${reqId}] limitPrice=${limitPriceNum} deviation=${deviation.toFixed(2)}% from oracle`);
    }

    // ── Compute trade parameters ───────────────────────────────────────────────
    const collateralAmountRaw = parseUnits(qtyNum.toFixed(8), decimals); // Use token-specific decimals

    // sizeDelta = collateral * leverage, expressed in 1e30 USD
    const priceForSize = orderType === "market" ? oraclePrice : parseFloat(limitPrice ?? "0") || oraclePrice;
    const sizeUsd      = qtyNum * priceForSize * levNum;
    const sizeDelta    = parseUnits(sizeUsd.toFixed(8), PRICE_DECIMALS);

    // acceptablePrice: for market orders apply slippage to oracle price
    const acceptablePrice = orderType === "market"
      ? applySlippage(priceRaw as bigint, isLong, slippageBps)
      : (limitPriceRaw ?? applySlippage(priceRaw as bigint, isLong, slippageBps));

    const acceptablePriceFmt = parseFloat(formatUnits(acceptablePrice, PRICE_DECIMALS));

    // triggerAboveThreshold:
    //   Limit long:  trigger when price rises above threshold (buy dip → false, price falls to limit)
    //   Limit short: trigger when price falls below threshold (sell top → true, price rises to limit... wait)
    // For increase orders (open position):
    //   Long  limit: triggerAboveThreshold = false  (buy when price ≤ limitPrice)
    //   Short limit: triggerAboveThreshold = true   (sell when price ≥ limitPrice)
    // For decrease orders (TP/SL):
    //   TP long:  triggerAboveThreshold = true  (close when price ≥ TP)
    //   SL long:  triggerAboveThreshold = false (close when price ≤ SL)
    //   TP short: triggerAboveThreshold = false (close when price ≤ TP, i.e. price dropped)
    //   SL short: triggerAboveThreshold = true  (close when price ≥ SL, i.e. price rose)
    const triggerAboveThreshold = orderType === "limit" ? !isLong : isLong;

    const isEthCollateral = collateralToken.toLowerCase() === WETH.toLowerCase();

    // ── Build response with contract call parameters ──────────────────────────
    const result: Record<string, unknown> = {
      orderType,
      account,
      isLong,
      isEthCollateral,
      oracle: {
        price: oraclePrice,
        minPrice: minPriceFmt,
        maxPrice: maxPriceFmt,
        priceRaw: (priceRaw as bigint).toString(),
      },
      computed: {
        collateralAmountRaw: collateralAmountRaw.toString(),
        sizeDelta:           sizeDelta.toString(),
        sizeUsd:             parseFloat(sizeUsd.toFixed(4)),
        acceptablePrice:     acceptablePrice.toString(),
        acceptablePriceFmt,
        executionFee:        executionFee.toString(),
        executionFeeEth:     formatUnits(executionFee, 18),
        triggerAboveThreshold,
        slippageBps:         slippageBps.toString(),
      },
    };

    // ── Per order-type call spec ──────────────────────────────────────────────
    if (orderType === "market") {
      // Router.increasePositionETH  /  Router.increasePosition
      result.callSpec = isEthCollateral
        ? {
            contract:     "Router",
            functionName: "increasePositionETH",
            // args: path[], indexToken, minOut, sizeDelta, isLong, acceptablePrice
            args: [
              [collateralToken],
              indexToken,
              "0",
              sizeDelta.toString(),
              isLong,
              acceptablePrice.toString(),
            ],
            value: collateralAmountRaw.toString(),
          }
        : {
            contract:     "Router",
            functionName: "increasePosition",
            // args: path[], indexToken, amountIn, minOut, sizeDelta, isLong, acceptablePrice
            args: [
              [collateralToken],
              indexToken,
              collateralAmountRaw.toString(),
              "0",
              sizeDelta.toString(),
              isLong,
              acceptablePrice.toString(),
            ],
          };
    } else if (orderType === "limit") {
      // OrderBook.createIncreaseOrder
      // args: path[], amountIn, indexToken, minOut, sizeDelta, collateralToken, isLong,
      //        triggerPrice, triggerAboveThreshold, executionFee, shouldWrap
      result.callSpec = {
        contract:     "OrderBook",
        functionName: "createIncreaseOrder",
        args: [
          [collateralToken],
          collateralAmountRaw.toString(),
          indexToken,
          "0",
          sizeDelta.toString(),
          collateralToken,
          isLong,
          (limitPriceRaw ?? 0n).toString(),
          triggerAboveThreshold,
          executionFee.toString(),
          isEthCollateral,
        ],
        value: (collateralAmountRaw + executionFee).toString(),
      };
    } else if (orderType === "decrease") {
      // OrderBook.createDecreaseOrder
      // args: indexToken, sizeDelta, collateralToken, collateralDelta, isLong,
      //        triggerPrice, triggerAboveThreshold
      result.callSpec = {
        contract:     "OrderBook",
        functionName: "createDecreaseOrder",
        args: [
          indexToken,
          sizeDelta.toString(),
          collateralToken,
          collateralAmountRaw.toString(),
          isLong,
          (limitPriceRaw ?? 0n).toString(),
          triggerAboveThreshold,
        ],
        value: executionFee.toString(),
      };
    }

    // ── Optional TP/SL parameters ─────────────────────────────────────────────
    if (tpPrice || slPriceVal) {
      const tpSlOrders: unknown[] = [];
      if (tpPrice) {
        const tpRaw   = parseUnits(parseFloat(tpPrice).toFixed(8), PRICE_DECIMALS);
        const tpAbove = isLong; // TP long = price rises above TP
        tpSlOrders.push({
          type:     "tp",
          contract: "OrderBook",
          functionName: "createDecreaseOrder",
          args: [indexToken, sizeDelta.toString(), collateralToken, collateralAmountRaw.toString(), isLong, tpRaw.toString(), tpAbove],
          value: executionFee.toString(),
        });
      }
      if (slPriceVal) {
        const slRaw   = parseUnits(parseFloat(slPriceVal).toFixed(8), PRICE_DECIMALS);
        const slAbove = !isLong; // SL long = price falls below SL
        tpSlOrders.push({
          type:     "sl",
          contract: "OrderBook",
          functionName: "createDecreaseOrder",
          args: [indexToken, sizeDelta.toString(), collateralToken, collateralAmountRaw.toString(), isLong, slRaw.toString(), slAbove],
          value: executionFee.toString(),
        });
      }
      result.tpSlCallSpecs = tpSlOrders;
    }

    console.log(`[execute][${reqId}] OK orderType=${orderType} sizeUsd=${sizeUsd.toFixed(2)} acceptablePrice=${acceptablePriceFmt} latency=${Date.now()-t0}ms`);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Order execution prep failed";
    console.error(`[execute][${reqId}] ERR latency=${Date.now()-t0}ms`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

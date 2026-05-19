/**
 * Contract-accurate position math utilities.
 *
 * All formulas are derived directly from Vault.sol + VaultUtils.sol.
 * See: validateLiquidation, getDelta, getPositionFee, getFundingFee.
 */

export const BASIS_POINTS_DIVISOR = 10000;
export const PRICE_PRECISION_EXP = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Liquidation Price
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the liquidation price matching VaultUtils.validateLiquidation.
 *
 * VaultUtils checks two binding conditions (whichever triggers first):
 *
 * Condition 3 — losses+fees wipe out collateral:
 *   collateral - delta < marginFees + liquidationFeeUsd
 *   => delta > collateral - totalFees
 *   buffer3 = collateral - (marginFee + liquidationFeeUsd)
 *
 * Condition 4 — remaining collateral can't support max leverage:
 *   (collateral - delta) * maxLeverageBps < size * BASIS_POINTS_DIVISOR
 *   => collateral - delta < size / maxLeverageX
 *   buffer4 = collateral - size / maxLeverageX
 *
 * The effective buffer is the minimum of the two (triggers first = closest to entry).
 *
 * For LONG:  liqPrice = avgPrice - effectiveBuffer * avgPrice / size
 * For SHORT: liqPrice = avgPrice + effectiveBuffer * avgPrice / size
 *
 * @param sizeUsd            Position size in USD (from formatUnits(size, 30))
 * @param collateralUsd      Collateral in USD (from formatUnits(collateral, 30))
 * @param avgPrice           Average entry price in USD
 * @param isLong             Direction of position
 * @param maxLeverage        Vault max leverage as a multiplier (e.g. 50 for 50×)
 * @param liquidationFeeUsd  Vault liquidationFeeUsd (already converted from 30-dec to USD number)
 * @param marginFeeBps       Vault marginFeeBasisPoints (e.g. 10 for 0.1%)
 */
export function computeLiquidationPrice({
  sizeUsd,
  collateralUsd,
  avgPrice,
  isLong,
  maxLeverage = 50,
  liquidationFeeUsd = 5,
  marginFeeBps = 10,
}: {
  sizeUsd: number;
  collateralUsd: number;
  avgPrice: number;
  isLong: boolean;
  maxLeverage?: number;
  liquidationFeeUsd?: number;
  marginFeeBps?: number;
}): number {
  if (sizeUsd <= 0 || collateralUsd <= 0 || avgPrice <= 0) return 0;

  // Margin fee charged on the full position size during liquidation
  // VaultUtils.getPositionFee: _sizeDelta * marginFeeBps / BASIS_POINTS_DIVISOR
  const marginFee = (sizeUsd * marginFeeBps) / BASIS_POINTS_DIVISOR;
  const totalFees = marginFee + liquidationFeeUsd;

  // Condition 3: remaining collateral after losses < totalFees
  const buffer3 = Math.max(0, collateralUsd - totalFees);

  // Condition 4: remaining collateral can't support maxLeverage
  // minCollateral = size * BASIS_POINTS_DIVISOR / (maxLeverage * BASIS_POINTS_DIVISOR)
  //               = size / maxLeverage
  const minCollateral = maxLeverage > 0 ? sizeUsd / maxLeverage : 0;
  const buffer4 = Math.max(0, collateralUsd - minCollateral);

  // Whichever condition triggers first has the smaller buffer (less price movement needed)
  const effectiveBuffer = Math.min(buffer3, buffer4);

  if (isLong) {
    return avgPrice - (effectiveBuffer * avgPrice) / sizeUsd;
  } else {
    return avgPrice + (effectiveBuffer * avgPrice) / sizeUsd;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unrealized PnL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes unrealized PnL matching Vault.getDelta:
 *   priceDelta = |currentPrice - avgPrice|
 *   delta = size * priceDelta / avgPrice
 *   hasProfit: long → currentPrice > avgPrice; short → avgPrice > currentPrice
 *
 * Returns a signed USD value (positive = profit, negative = loss).
 */
export function computeUnrealizedPnl(
  sizeUsd: number,
  avgPrice: number,
  currentPrice: number,
  isLong: boolean
): number {
  if (avgPrice <= 0 || currentPrice <= 0 || sizeUsd <= 0) return 0;
  const priceDelta = isLong
    ? currentPrice - avgPrice
    : avgPrice - currentPrice;
  return (sizeUsd * priceDelta) / avgPrice;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leverage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns effective leverage = size / collateral.
 * Matches Vault.getPositionLeverage: (position.size * BASIS_POINTS_DIVISOR) / position.collateral
 * but returns a plain multiplier (not basis-point encoded).
 */
export function computeLeverage(sizeUsd: number, collateralUsd: number): number {
  return collateralUsd > 0 ? sizeUsd / collateralUsd : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Estimated liquidation price for a NEW (not yet opened) order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimates the liquidation price for an order that hasn't been placed yet.
 * Uses the same contract formula as computeLiquidationPrice.
 *
 * @param entryPrice         Intended entry price
 * @param positionSizeUsd    Position size in USD (quantity × price)
 * @param leverage           Desired leverage multiplier
 * @param isLong             Direction
 * @param maxLeverage        Vault max leverage multiplier (e.g. 50)
 * @param liquidationFeeUsd  Vault liquidation fee already converted to USD
 * @param marginFeeBps       Vault marginFeeBasisPoints (e.g. 10 for 0.1%)
 */
export function estimateLiquidationPrice({
  entryPrice,
  positionSizeUsd,
  leverage,
  isLong,
  maxLeverage = 50,
  liquidationFeeUsd = 5,
  marginFeeBps = 10,
}: {
  entryPrice: number;
  positionSizeUsd: number;
  leverage: number;
  isLong: boolean;
  maxLeverage?: number;
  liquidationFeeUsd?: number;
  marginFeeBps?: number;
}): number {
  if (entryPrice <= 0 || leverage <= 0 || positionSizeUsd <= 0) return 0;
  const collateralUsd = positionSizeUsd / leverage;
  return computeLiquidationPrice({
    sizeUsd: positionSizeUsd,
    collateralUsd,
    avgPrice: entryPrice,
    isLong,
    maxLeverage,
    liquidationFeeUsd,
    marginFeeBps,
  });
}

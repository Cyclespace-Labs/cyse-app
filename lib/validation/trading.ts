"use client";

import { formatUnits } from "viem";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface OrderValidationInput {
  price: number;
  quantity: number;
  leverage: number;
  side: "buy" | "sell";
  orderType: "market" | "limit" | "conditional";
  availableBalance: number;
  oraclePrice: number | null;
  maxLeverage?: number;
  minLeverage?: number;
  slippageBps?: number;
}

export interface PositionValidationInput {
  size: number;
  collateral: number;
  averagePrice: number;
  isLong: boolean;
  currentPrice: number | null;
  liquidationFee?: number;
}

// Constants
export const MIN_LEVERAGE = 1;
export const MAX_LEVERAGE = 50;
export const HIGH_LEVERAGE_THRESHOLD = 20;
export const MIN_ORDER_SIZE = 0.001;
export const MAX_SLIPPAGE_BPS = 100; // 1%
export const DEFAULT_SLIPPAGE_BPS = 30; // 0.3%
export const LIQUIDATION_WARNING_THRESHOLD = 0.1; // 10% from liq price
export const LIQUIDATION_DANGER_THRESHOLD = 0.05; // 5% from liq price

/**
 * Validates order inputs with real-time checks
 */
export function validateOrder(input: OrderValidationInput): ValidationError[] {
  const errors: ValidationError[] = [];
  const {
    price,
    quantity,
    leverage,
    side,
    orderType,
    availableBalance,
    oraclePrice,
    maxLeverage = MAX_LEVERAGE,
    minLeverage = MIN_LEVERAGE,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
  } = input;

  // Price validation
  if (orderType !== "market") {
    if (!price || price <= 0) {
      errors.push({
        field: "price",
        message: "Price must be greater than 0",
        severity: "error",
      });
    }

    // Oracle deviation check
    if (oraclePrice && price > 0) {
      const deviation = Math.abs((price - oraclePrice) / oraclePrice) * 100;
      const maxDeviation = (slippageBps / 100) * 2; // 2x slippage as max deviation

      if (deviation > maxDeviation) {
        errors.push({
          field: "price",
          message: `Price deviates ${deviation.toFixed(2)}% from oracle. Max: ${maxDeviation.toFixed(2)}%`,
          severity: "error",
        });
      } else if (deviation > maxDeviation * 0.5) {
        errors.push({
          field: "price",
          message: `Price deviates ${deviation.toFixed(2)}% from oracle`,
          severity: "warning",
        });
      }
    }
  }

  // Quantity validation
  if (!quantity || quantity <= 0) {
    errors.push({
      field: "quantity",
      message: "Quantity must be greater than 0",
      severity: "error",
    });
  } else if (quantity < MIN_ORDER_SIZE) {
    errors.push({
      field: "quantity",
      message: `Minimum order size is ${MIN_ORDER_SIZE}`,
      severity: "error",
    });
  }

  // Leverage validation
  if (!leverage || leverage < minLeverage) {
    errors.push({
      field: "leverage",
      message: `Minimum leverage is ${minLeverage}x`,
      severity: "error",
    });
  } else if (leverage > maxLeverage) {
    errors.push({
      field: "leverage",
      message: `Maximum leverage is ${maxLeverage}x`,
      severity: "error",
    });
  } else if (leverage > HIGH_LEVERAGE_THRESHOLD) {
    errors.push({
      field: "leverage",
      message: `High leverage (${leverage}x) increases liquidation risk`,
      severity: "warning",
    });
  }

  // Balance validation
  const orderValue = price * quantity;
  const marginRequired = orderValue / leverage;

  if (availableBalance <= 0) {
    errors.push({
      field: "balance",
      message: "Wallet not connected or no balance available",
      severity: "error",
    });
  } else if (marginRequired > availableBalance) {
    const shortfall = marginRequired - availableBalance;
    errors.push({
      field: "balance",
      message: `Insufficient balance. Need $${marginRequired.toFixed(2)}, short by $${shortfall.toFixed(2)}`,
      severity: "error",
    });
  } else if (marginRequired > availableBalance * 0.9) {
    errors.push({
      field: "balance",
      message: `Using >90% of available balance. Leave funds for fees.`,
      severity: "warning",
    });
  }

  // Market-specific validations
  if (orderType === "market") {
    if (!oraclePrice) {
      errors.push({
        field: "price",
        message: "Oracle price unavailable. Cannot execute market order.",
        severity: "error",
      });
    }
  }

  return errors;
}

/**
 * Calculates position health metrics
 */
export function calculatePositionHealth(
  input: PositionValidationInput
): {
  healthScore: number; // 0-100
  liquidationPrice: number | null;
  liquidationDistance: number | null; // % from current price
  pnl: number;
  pnlPercent: number;
  status: "safe" | "warning" | "danger" | "liquidated";
} {
  const { size, collateral, averagePrice, isLong, currentPrice, liquidationFee = 5 } = input;

  if (!size || !collateral || !averagePrice || size === 0) {
    return {
      healthScore: 0,
      liquidationPrice: null,
      liquidationDistance: null,
      pnl: 0,
      pnlPercent: 0,
      status: "safe",
    };
  }

  // Calculate PnL
  let pnl = 0;
  if (currentPrice) {
    const priceDiff = isLong ? currentPrice - averagePrice : averagePrice - currentPrice;
    const sizeInTokens = size / averagePrice; // Approximate
    pnl = priceDiff * sizeInTokens;
  }

  const pnlPercent = (pnl / collateral) * 100;

  // Calculate leverage
  const leverage = size / collateral;

  // Calculate liquidation price
  // Liq price = entry price ± (entry price / leverage) * (1 - maintenance margin)
  const maintenanceMargin = 0.005; // 0.5%
  const liqBuffer = (averagePrice / leverage) * (1 - maintenanceMargin);
  const liquidationPrice = isLong ? averagePrice - liqBuffer : averagePrice + liqBuffer;

  // Calculate distance to liquidation
  let liquidationDistance: number | null = null;
  if (currentPrice) {
    const distance = Math.abs(currentPrice - liquidationPrice);
    liquidationDistance = (distance / currentPrice) * 100;
  }

  // Determine health status
  let status: "safe" | "warning" | "danger" | "liquidated" = "safe";
  let healthScore = 100;

  if (currentPrice) {
    const isLiquidated = isLong
      ? currentPrice <= liquidationPrice
      : currentPrice >= liquidationPrice;

    if (isLiquidated) {
      status = "liquidated";
      healthScore = 0;
    } else if (liquidationDistance && liquidationDistance <= LIQUIDATION_DANGER_THRESHOLD * 100) {
      status = "danger";
      healthScore = 20;
    } else if (liquidationDistance && liquidationDistance <= LIQUIDATION_WARNING_THRESHOLD * 100) {
      status = "warning";
      healthScore = 50;
    } else {
      // Score based on leverage and distance
      const leverageFactor = Math.max(0, 1 - (leverage - 1) / (MAX_LEVERAGE - 1));
      const distanceFactor = Math.min(1, (liquidationDistance || 50) / 20);
      healthScore = Math.round((leverageFactor * 0.4 + distanceFactor * 0.6) * 100);
    }
  }

  return {
    healthScore,
    liquidationPrice,
    liquidationDistance,
    pnl,
    pnlPercent,
    status,
  };
}

/**
 * Validates TP/SL prices
 */
export function validateTPSL(
  tpPrice: number | null,
  slPrice: number | null,
  entryPrice: number,
  isLong: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (tpPrice !== null && tpPrice > 0) {
    if (isLong && tpPrice <= entryPrice) {
      errors.push({
        field: "tpPrice",
        message: "Take Profit must be above entry price for longs",
        severity: "error",
      });
    } else if (!isLong && tpPrice >= entryPrice) {
      errors.push({
        field: "tpPrice",
        message: "Take Profit must be below entry price for shorts",
        severity: "error",
      });
    }
  }

  if (slPrice !== null && slPrice > 0) {
    if (isLong && slPrice >= entryPrice) {
      errors.push({
        field: "slPrice",
        message: "Stop Loss must be below entry price for longs",
        severity: "error",
      });
    } else if (!isLong && slPrice <= entryPrice) {
      errors.push({
        field: "slPrice",
        message: "Stop Loss must be above entry price for shorts",
        severity: "error",
      });
    }
  }

  // Check if SL is too close to entry
  if (slPrice && entryPrice > 0) {
    const slDistance = Math.abs((slPrice - entryPrice) / entryPrice) * 100;
    if (slDistance < 0.5) {
      errors.push({
        field: "slPrice",
        message: "Stop Loss too close to entry price (<0.5%). May trigger immediately.",
        severity: "warning",
      });
    }
  }

  return errors;
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): {
  errors: string[];
  warnings: string[];
} {
  return {
    errors: errors.filter((e) => e.severity === "error").map((e) => e.message),
    warnings: errors.filter((e) => e.severity === "warning").map((e) => e.message),
  };
}

export default {
  validateOrder,
  calculatePositionHealth,
  validateTPSL,
  formatValidationErrors,
  MIN_LEVERAGE,
  MAX_LEVERAGE,
  HIGH_LEVERAGE_THRESHOLD,
  MIN_ORDER_SIZE,
  MAX_SLIPPAGE_BPS,
  DEFAULT_SLIPPAGE_BPS,
  LIQUIDATION_WARNING_THRESHOLD,
  LIQUIDATION_DANGER_THRESHOLD,
};

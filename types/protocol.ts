export interface VaultPosition {
  size: bigint;
  collateral: bigint;
  averagePrice: bigint;
  entryFundingRate: bigint;
  reserveAmount: bigint;
  realisedPnl: bigint;
  hasRealisedProfit: boolean;
  lastIncreasedTime: bigint;
  hasProfit?: boolean;
  delta?: bigint;
}

export interface IncreaseOrderRequest {
  path: `0x${string}`[];
  amountIn: bigint;
  indexToken: `0x${string}`;
  minOut: bigint;
  sizeDelta: bigint;
  collateralToken: `0x${string}`;
  isLong: boolean;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
  executionFee: bigint;
}

export interface DecreaseOrderRequest {
  indexToken: `0x${string}`;
  sizeDelta: bigint;
  collateralToken: `0x${string}`;
  collateralDelta: bigint;
  isLong: boolean;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
}

export interface OnChainIncreaseOrder {
  index: number;
  type: "increase";
  purchaseToken: `0x${string}`;
  purchaseTokenAmount: bigint;
  collateralToken: `0x${string}`;
  indexToken: `0x${string}`;
  sizeDelta: bigint;
  isLong: boolean;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
  executionFee: bigint;
  tp?: bigint;
  sl?: bigint;
}

export interface OnChainDecreaseOrder {
  index: number;
  type: "decrease";
  collateralToken: `0x${string}`;
  collateralDelta: bigint;
  indexToken: `0x${string}`;
  sizeDelta: bigint;
  isLong: boolean;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
  executionFee: bigint;
  tp?: bigint;
  sl?: bigint;
}

export type OnChainOrder = OnChainIncreaseOrder | OnChainDecreaseOrder;

export interface TxStatus {
  state: "idle" | "pending" | "submitted" | "confirmed" | "failed";
  hash?: `0x${string}`;
  error?: string;
}

export interface TradeParams {
  side: "buy" | "sell";
  type: "limit" | "market" | "conditional";
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
  sizeDelta: bigint;
  collateralAmount: bigint;
  price: bigint;
  leverage: number;
  tp?: bigint;
  sl?: bigint;
}

export function formatPrice(price: number, decimals = 2): string {
  return price.toFixed(decimals);
}

export function formatSize(size: number, decimals = 2): string {
  return size.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(2)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(2)}K`;
  return volume.toFixed(2);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Compute live unrealized PnL for a position using current market price.
 * Falls back to on-chain PnL if currentPrice is not available.
 */
export function computeLivePnl(
  sizeUsd: number,
  entryPrice: number,
  isLong: boolean,
  currentPrice: number,
  onChainPnl: number
): number {
  if (!currentPrice || currentPrice <= 0 || !entryPrice || entryPrice <= 0) {
    return onChainPnl;
  }
  const priceChange = isLong
    ? (currentPrice - entryPrice) / entryPrice
    : (entryPrice - currentPrice) / entryPrice;
  return sizeUsd * priceChange;
}

/**
 * Compute live unrealized PnL percentage.
 */
export function computeLivePnlPct(
  livePnl: number,
  collateralUsd: number
): number {
  if (!collateralUsd || collateralUsd <= 0) return 0;
  return (livePnl / collateralUsd) * 100;
}

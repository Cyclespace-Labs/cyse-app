"use client";

import { useVaultPosition } from "./useVaultPosition";
import { contracts } from "@/lib/protocol/contracts";
import { Position } from "@/types/trading";

type VaultPos = NonNullable<ReturnType<typeof useVaultPosition>["position"]>;

function toUIPosition(pos: VaultPos, symbol: string, isLong: boolean): Position {
  const leverage = pos.collateralUsd > 0 ? pos.sizeUsd / pos.collateralUsd : 1;
  return {
    id: `${symbol}-${isLong ? "long" : "short"}`,
    symbol: `${symbol}-PERP`,
    side: isLong ? "long" : "short",
    entryPrice: pos.avgPriceFormatted,
    quantity: pos.sizeUsd,
    leverage: parseFloat(leverage.toFixed(2)),
    liquidationPrice: pos.liquidationPrice,
    unrealizedPnl: pos.unrealizedPnlUsd,
    unrealizedPnlPct: pos.unrealizedPnlPct,
    margin: pos.collateralUsd,
    createdAt: Number(pos.lastIncreasedTime),
  };
}

export function useAllPositions() {
  const weth = contracts.weth.address;
  const btc = contracts.btc.address;

  const { position: ethLong, isLoading: l1 } = useVaultPosition({ collateralToken: weth, indexToken: weth, isLong: true });
  const { position: ethShort, isLoading: l2 } = useVaultPosition({ collateralToken: weth, indexToken: weth, isLong: false });
  const { position: btcLong, isLoading: l3 } = useVaultPosition({ collateralToken: btc, indexToken: btc, isLong: true });
  const { position: btcShort, isLoading: l4 } = useVaultPosition({ collateralToken: btc, indexToken: btc, isLong: false });

  const positions: Position[] = [
    ethLong ? toUIPosition(ethLong, "ETH", true) : null,
    ethShort ? toUIPosition(ethShort, "ETH", false) : null,
    btcLong ? toUIPosition(btcLong, "BTC", true) : null,
    btcShort ? toUIPosition(btcShort, "BTC", false) : null,
  ].filter(Boolean) as Position[];

  return { positions, isLoading: l1 || l2 || l3 || l4 };
}

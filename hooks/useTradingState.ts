import { useState, useCallback } from "react";
import { Order, Position } from "@/types/trading";
import { getBestBidAsk, getTickSize } from "@/lib/tradingData";
import { WalletState } from "@/contexts/WalletContext";

let orderIdCounter = 1;
let positionIdCounter = 1;

export function useTradingState(
  selectedSymbol: string,
  wallet: WalletState,
  updateBalance: (delta: number) => void,
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orderPending, setOrderPending] = useState(false);
  const [lastNotification, setLastNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const placeOrder = useCallback(
    (params: {
      side: "buy" | "sell";
      type: "limit" | "market" | "conditional";
      price: number;
      quantity: number;
      leverage: number;
      tp?: number;
      sl?: number;
    }) => {
      if (!wallet.connected) return;

      const orderValue = params.price * params.quantity;
      const marginRequired = orderValue / params.leverage;

      if (marginRequired > wallet.balance) {
        setLastNotification({ type: "error", message: "Insufficient balance" });
        setTimeout(() => setLastNotification(null), 3000);
        return;
      }

      setOrderPending(true);

      const orderId = `ORD-${orderIdCounter++}`;
      const newOrder: Order = {
        id: orderId,
        symbol: selectedSymbol,
        side: params.side,
        type: params.type,
        price: params.price,
        quantity: params.quantity,
        filled: 0,
        status: params.type === "market" ? "pending" : "open",
        createdAt: Date.now(),
        tp: params.tp,
        sl: params.sl,
      };

      setTimeout(() => {
        if (params.type === "market") {
          // Market orders fill immediately
          const { bid, ask } = getBestBidAsk(selectedSymbol);
          const fillPrice = params.side === "buy" ? ask : bid;
          const tickSize = getTickSize(fillPrice);
          const leverageVal = params.leverage;
          const liqDistance = fillPrice / leverageVal;
          const liquidationPrice =
            params.side === "buy"
              ? parseFloat((fillPrice - liqDistance).toFixed(Math.max(2, -Math.floor(Math.log10(tickSize)))))
              : parseFloat((fillPrice + liqDistance).toFixed(Math.max(2, -Math.floor(Math.log10(tickSize)))));

          const posId = `POS-${positionIdCounter++}`;
          const newPosition: Position = {
            id: posId,
            symbol: selectedSymbol,
            side: params.side === "buy" ? "long" : "short",
            entryPrice: fillPrice,
            quantity: params.quantity,
            leverage: leverageVal,
            liquidationPrice,
            unrealizedPnl: 0,
            unrealizedPnlPct: 0,
            margin: marginRequired,
            createdAt: Date.now(),
          };

          setPositions((prev) => [...prev, newPosition]);
          updateBalance(-marginRequired);

          const filledOrder: Order = { ...newOrder, status: "filled", filled: params.quantity };
          setOrders((prev) => [...prev, filledOrder]);
          setLastNotification({
            type: "success",
            message: `Market ${params.side} ${params.quantity} ${selectedSymbol} filled at ${fillPrice}`,
          });
        } else {
          // Limit orders stay open
          setOrders((prev) => [...prev, newOrder]);
          updateBalance(-marginRequired);
          setLastNotification({
            type: "success",
            message: `Limit ${params.side} ${params.quantity} ${selectedSymbol} at ${params.price} placed`,
          });
        }

        setOrderPending(false);
        setTimeout(() => setLastNotification(null), 3000);
      }, 1200);
    },
    [wallet, selectedSymbol, updateBalance]
  );

  const cancelOrder = useCallback(
    (orderId: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === orderId);
        if (order && order.status === "open") {
          const orderValue = order.price * order.quantity;
          const marginReturn = orderValue / 10; // approximate
          updateBalance(marginReturn);
        }
        return prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" as const } : o));
      });
      setLastNotification({ type: "success", message: `Order ${orderId} cancelled` });
      setTimeout(() => setLastNotification(null), 3000);
    },
    [updateBalance],
  );

  const closePosition = useCallback(
    (positionId: string) => {
      setPositions((prev) => {
        const pos = prev.find((p) => p.id === positionId);
        if (pos) {
          const returnAmount = pos.margin + pos.unrealizedPnl;
          updateBalance(returnAmount);
        }
        return prev.filter((p) => p.id !== positionId);
      });
      setLastNotification({ type: "success", message: `Position closed` });
      setTimeout(() => setLastNotification(null), 3000);
    },
    [updateBalance],
  );

  const updatePositionPnl = useCallback(
    (currentPrice: number) => {
      setPositions((prev) =>
        prev
          .filter((p) => p.symbol === selectedSymbol)
          .map((pos) => {
            const priceDiff = pos.side === "long" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
            const pnl = priceDiff * pos.quantity;
            const pnlPct = (priceDiff / pos.entryPrice) * 100 * pos.leverage;
            return {
              ...pos,
              unrealizedPnl: parseFloat(pnl.toFixed(2)),
              unrealizedPnlPct: parseFloat(pnlPct.toFixed(2)),
            };
          })
          .concat(prev.filter((p) => p.symbol !== selectedSymbol))
      );
    },
    [selectedSymbol]
  );

  const openOrders = orders.filter((o) => o.status === "open" && o.symbol === selectedSymbol);
  const activePositions = positions.filter((p) => p.symbol === selectedSymbol);

  return {
    orders,
    positions,
    openOrders,
    activePositions,
    orderPending,
    lastNotification,
    placeOrder,
    cancelOrder,
    closePosition,
    updatePositionPnl,
  };
}

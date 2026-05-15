"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatUnits } from "viem";

interface IncreaseOrder {
  index: number;
  isLong: boolean;
  triggerPrice: bigint;
}

interface DecreaseOrder {
  index: number;
  isLong: boolean;
  indexToken: string;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
}

interface OpenOrdersPanelProps {
  walletConnected: boolean;
  increaseOrders: IncreaseOrder[];
  decreaseOrders: DecreaseOrder[];
  orderSigning: boolean;
  onCancelIncreaseOrder: (index: number) => void;
  onCancelDecreaseOrder: (index: number) => void;
}

export default function OpenOrdersPanel({
  walletConnected,
  increaseOrders,
  decreaseOrders,
  orderSigning,
  onCancelIncreaseOrder,
  onCancelDecreaseOrder,
}: OpenOrdersPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !walletConnected || (increaseOrders.length === 0 && decreaseOrders.length === 0)) return null;

  return (
    <div className="pt-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
      <span className="text-[11px] mb-2 block" style={{ color: "var(--on-surface-disabled)" }}>Open Orders</span>
      {increaseOrders.map((order) => (
        <div key={`inc-${order.index}`} className="flex items-center justify-between rounded p-2 mb-1.5" style={{ background: "var(--surface-container-low)" }}>
          <div>
            <span className="text-[10px] font-mono font-medium" style={{ color: order.isLong ? "var(--buy)" : "var(--sell)" }}>
              {order.isLong ? "BUY" : "SELL"} @ {parseFloat(formatUnits(order.triggerPrice, 30)).toFixed(4)}
            </span>
            <span className="text-[9px] ml-2" style={{ color: "var(--on-surface-disabled)" }}>Limit</span>
          </div>
          <button
            onClick={() => onCancelIncreaseOrder(order.index)}
            disabled={orderSigning}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--on-surface-disabled)" }}
            title="Cancel order"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {decreaseOrders.map((order) => (
        <div key={`dec-${order.index}`} className="flex items-center justify-between rounded p-2 mb-1.5" style={{ background: "var(--surface-container-low)" }}>
          <div>
            <span className="text-[10px] font-mono font-medium" style={{ color: "var(--sell)" }}>
              CLOSE @ {parseFloat(formatUnits(order.triggerPrice, 30)).toFixed(4)}
            </span>
            <span className="text-[9px] ml-2" style={{ color: "var(--on-surface-disabled)" }}>TP/SL</span>
          </div>
          <button
            onClick={() => onCancelDecreaseOrder(order.index)}
            disabled={orderSigning}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--on-surface-disabled)" }}
            title="Cancel order"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

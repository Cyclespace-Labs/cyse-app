"use client";

import { X } from "lucide-react";
import { AlertTriangle } from "lucide-react";

interface OrphanedOrder {
  index: number;
  collateralToken: string;
  indexToken: string;
  isLong: boolean;
}

interface TradingAlertsProps {
  notification: {
    type: "success" | "info" | "error";
    message: string;
  } | null;
  onDismissNotification: () => void;
  orphanedOrders: OrphanedOrder[];
  onCancelOrphanedOrders: () => void;
  orderSigning: boolean;
}

export default function TradingAlerts({
  notification,
  onDismissNotification,
  orphanedOrders,
  onCancelOrphanedOrders,
  orderSigning,
}: TradingAlertsProps) {
  return (
    <>
      {/* Notification */}
      {notification && (
        <div
          className="px-3 py-2 text-[11px] font-mono flex items-center justify-between"
          style={{
            background: notification.type === "success"
              ? "rgba(0,192,118,0.1)"
              : notification.type === "info"
              ? "rgba(99,179,255,0.1)"
              : "rgba(255,77,79,0.1)",
            color: notification.type === "success"
              ? "var(--buy)"
              : notification.type === "info"
              ? "#63b3ff"
              : "var(--sell)",
          }}
        >
          <span className="truncate">{notification.message}</span>
          <button onClick={onDismissNotification} className="ml-2 opacity-60 hover:opacity-100 shrink-0"><X size={10} /></button>
        </div>
      )}

      {/* Orphaned Orders Cleanup Prompt */}
      {orphanedOrders.length > 0 && (
        <div className="mx-3 mt-3 p-3 rounded" style={{ background: "rgba(255, 171, 0, 0.1)", border: "1px solid rgba(255, 171, 0, 0.3)" }}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-[11px] font-medium" style={{ color: "var(--on-surface)" }}>Position Closed</h4>
              <p className="text-[10px] mt-1" style={{ color: "var(--on-surface-disabled)" }}>
                Your position was closed. You have {orphanedOrders.length} orphaned order(s) for this position. Cancel them to refund your execution fee.
              </p>
            </div>
          </div>
          <button
            onClick={onCancelOrphanedOrders}
            disabled={orderSigning}
            className="mt-2 w-full py-1.5 text-[10px] font-semibold rounded transition-colors"
            style={{ background: "rgba(255, 171, 0, 0.2)", color: "var(--on-surface)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255, 171, 0, 0.3)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255, 171, 0, 0.2)")}
          >
            {orderSigning ? "Refunding..." : "Cancel & Refund Fees"}
          </button>
        </div>
      )}
    </>
  );
}

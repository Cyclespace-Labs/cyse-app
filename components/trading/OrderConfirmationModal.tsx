"use client";

import { X, AlertTriangle } from "lucide-react";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  warnings?: string[];
  orderDetails: {
    type: "market" | "limit" | "conditional";
    side: "buy" | "sell";
    price: number;
    quantity: number;
    leverage: number;
    totalValue: number;
    marginRequired: number;
    slippage?: number;
  };
  highRisk?: boolean;
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  warnings = [],
  orderDetails,
  highRisk = false,
}: OrderConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl overflow-hidden w-[400px]"
        style={{ background: "var(--surface-container)", border: "1px solid rgba(66,70,84,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}
        >
          <div className="flex items-center gap-2">
            {highRisk && <AlertTriangle size={16} style={{ color: "#FFA500" }} />}
            <span className="text-[13px] font-semibold" style={{ color: "var(--on-surface)" }}>
              {title}
            </span>
          </div>
          <button onClick={onClose}>
            <X size={14} style={{ color: "var(--on-surface-disabled)" }} />
          </button>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div
            className="px-4 py-2 space-y-1"
            style={{ background: highRisk ? "rgba(255,77,79,0.08)" : "rgba(255,165,0,0.08)", borderBottom: "1px solid rgba(66,70,84,0.4)" }}
          >
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: highRisk ? "var(--sell)" : "#FFA500" }}>
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Order Details */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Order Type</span>
            <span style={{ color: "var(--on-surface)" }}>{orderDetails.type.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Side</span>
            <span
              style={{ color: orderDetails.side === "buy" ? "var(--buy)" : "var(--sell)" }}
              className="font-medium"
            >
              {orderDetails.side.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Price</span>
            <span className="font-mono" style={{ color: "var(--on-surface)" }}>
              ${orderDetails.price.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Quantity</span>
            <span className="font-mono" style={{ color: "var(--on-surface)" }}>
              {orderDetails.quantity.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Leverage</span>
            <span className="font-mono" style={{ color: "var(--on-surface)" }}>
              {orderDetails.leverage}x
            </span>
          </div>
          {orderDetails.slippage && (
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--on-surface-disabled)" }}>Slippage</span>
              <span className="font-mono" style={{ color: "var(--on-surface)" }}>
                {(orderDetails.slippage / 100).toFixed(2)}%
              </span>
            </div>
          )}
          <div
            className="flex items-center justify-between text-[11px] pt-2 mt-2"
            style={{ borderTop: "1px solid rgba(66,70,84,0.3)" }}
          >
            <span style={{ color: "var(--on-surface-disabled)" }}>Total Value</span>
            <span className="font-mono" style={{ color: "var(--on-surface)" }}>
              ${orderDetails.totalValue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Margin Required</span>
            <span className="font-mono" style={{ color: "var(--on-surface)" }}>
              ${orderDetails.marginRequired.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-3" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[12px] font-medium rounded-lg transition-colors"
            style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-[12px] font-medium rounded-lg transition-colors"
            style={{
              background: highRisk
                ? "linear-gradient(135deg, var(--sell) 0%, var(--sell-bright) 100%)"
                : "linear-gradient(135deg, var(--buy) 0%, var(--buy-bright) 100%)",
              color: highRisk ? "var(--on-primary)" : "#000",
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

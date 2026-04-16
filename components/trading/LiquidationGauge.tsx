"use client";

interface LiquidationGaugeProps {
  healthScore: number; // 0-100
  status: "safe" | "warning" | "danger" | "liquidated";
  liquidationPrice: number | null;
  currentPrice: number | null;
  isLong: boolean;
}

export default function LiquidationGauge({
  healthScore,
  status,
  liquidationPrice,
  currentPrice,
  isLong,
}: LiquidationGaugeProps) {
  const getColor = () => {
    switch (status) {
      case "safe":
        return "var(--buy)";
      case "warning":
        return "#FFA500"; // Orange
      case "danger":
      case "liquidated":
        return "var(--sell)";
      default:
        return "var(--on-surface-disabled)";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "safe":
        return "Healthy";
      case "warning":
        return "At Risk";
      case "danger":
        return "High Risk";
      case "liquidated":
        return "Liquidated";
      default:
        return "Unknown";
    }
  };

  const liqDistance =
    currentPrice && liquidationPrice
      ? Math.abs(((currentPrice - liquidationPrice) / currentPrice) * 100).toFixed(2)
      : null;

  return (
    <div className="rounded p-2.5" style={{ background: "var(--surface-container-low)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>
          Position Health
        </span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            background: `${getColor()}20`,
            color: getColor(),
          }}
        >
          {getLabel()}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative h-1.5 rounded-full mb-2" style={{ background: "var(--surface-container-high)" }}>
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, healthScore))}%`,
            background:
              status === "safe"
                ? "linear-gradient(90deg, var(--buy) 0%, #00ff88 100%)"
                : status === "warning"
                ? "linear-gradient(90deg, #FFA500 0%, #FFD700 100%)"
                : "linear-gradient(90deg, var(--sell) 0%, #ff4444 100%)",
          }}
        />
        {/* Threshold markers */}
        <div
          className="absolute top-0 w-0.5 h-full"
          style={{ left: "50%", background: "rgba(255,165,0,0.5)" }}
        />
        <div
          className="absolute top-0 w-0.5 h-full"
          style={{ left: "20%", background: "rgba(255,77,79,0.5)" }}
        />
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-[10px]">
        <span style={{ color: "var(--on-surface-disabled)" }}>Liq. Price</span>
        <span
          className="font-mono"
          style={{ color: status === "danger" || status === "liquidated" ? "var(--sell)" : "var(--on-surface)" }}
        >
          {liquidationPrice ? liquidationPrice.toFixed(4) : "—"}
        </span>
      </div>

      {liqDistance && (
        <div className="flex items-center justify-between text-[10px] mt-1">
          <span style={{ color: "var(--on-surface-disabled)" }}>Distance</span>
          <span
            className="font-mono"
            style={{
              color:
                status === "safe" ? "var(--buy)" : status === "warning" ? "#FFA500" : "var(--sell)",
            }}
          >
            {liqDistance}%
          </span>
        </div>
      )}
    </div>
  );
}

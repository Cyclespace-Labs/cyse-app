"use client";

interface SlippageSelectorProps {
  value: number; // in basis points
  onChange: (slippageBps: number) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: "0.1%", value: 10 },
  { label: "0.5%", value: 50 },
  { label: "1%", value: 100 },
];

export default function SlippageSelector({ value, onChange, disabled }: SlippageSelectorProps) {
  const isCustom = !PRESETS.some((p) => p.value === value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-on-surface-muted">
        Slippage
      </span>
      <div className="flex items-center gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => !disabled && onChange(preset.value)}
            disabled={disabled}
            className="px-2 py-0.5 text-[10px] font-mono rounded transition-colors"
            style={{
              background: value === preset.value ? "var(--surface-container-high)" : "transparent",
              color: value === preset.value ? "var(--on-surface)" : "var(--on-surface-muted)",
              border: value === preset.value ? "1px solid var(--outline-variant)" : "1px solid transparent",
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!disabled && value !== preset.value) {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && value !== preset.value) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)";
              }
            }}
          >
            {preset.label}
          </button>
        ))}
        <div className="relative">
          <input
            type="number"
            value={isCustom ? value / 100 : ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 5) {
                onChange(Math.round(val * 100));
              }
            }}
            placeholder="Custom"
            disabled={disabled}
            className="w-16 px-2 py-0.5 text-[10px] font-mono rounded bg-transparent text-right outline-none"
            style={{
              border: isCustom ? "1px solid var(--outline-variant)" : "1px solid transparent",
              color: isCustom ? "var(--on-surface)" : "var(--on-surface-disabled)",
            }}
          />
          {isCustom && <span className="absolute right-6 top-0.5 text-[9px] text-[var(--on-surface-disabled)]">%</span>}
        </div>
      </div>
    </div>
  );
}

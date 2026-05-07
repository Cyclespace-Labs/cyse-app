"use client";

interface TPSLSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  tpPrice: string;
  onTpPriceChange: (value: string) => void;
  slPrice: string;
  onSlPriceChange: (value: string) => void;
}

export default function TPSLSection({
  enabled,
  onToggle,
  tpPrice,
  onTpPriceChange,
  slPrice,
  onSlPriceChange,
}: TPSLSectionProps) {
  return (
    <>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
        />
        <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>TP/SL</span>
      </label>

      {enabled && (
        <div className="space-y-2">
          <div>
            <label htmlFor="tp-input" className="text-[10px] mb-1 block" style={{ color: "var(--buy)" }}>Take Profit</label>
            <div className="flex items-center rounded px-3 py-1.5" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
              <input
                id="tp-input"
                type="text"
                value={tpPrice}
                onChange={(e) => onTpPriceChange(e.target.value)}
                placeholder="TP Price"
                className="flex-1 bg-transparent text-sm outline-none font-mono"
                style={{ color: "var(--on-surface)" }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="sl-input" className="text-[10px] mb-1 block" style={{ color: "var(--sell)" }}>Stop Loss</label>
            <div className="flex items-center rounded px-3 py-1.5" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
              <input
                id="sl-input"
                type="text"
                value={slPrice}
                onChange={(e) => onSlPriceChange(e.target.value)}
                placeholder="SL Price"
                className="flex-1 bg-transparent text-sm outline-none font-mono"
                style={{ color: "var(--on-surface)" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

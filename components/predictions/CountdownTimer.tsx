"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiryDate: string;
}

export default function CountdownTimer({ expiryDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    function calculate() {
      const diff = Math.max(0, new Date(expiryDate).getTime() - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, mins, secs });
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1 font-mono">
      {timeLeft.days > 0 && (
        <>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold leading-none" style={{ color: "var(--warning)" }}>{pad(timeLeft.days)}</span>
            <span className="text-[9px] uppercase" style={{ color: "var(--on-surface-disabled)" }}>Days</span>
          </div>
          <span className="text-lg mx-0.5" style={{ color: "var(--on-surface-disabled)" }}>:</span>
        </>
      )}
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold leading-none" style={{ color: "var(--warning)" }}>{pad(timeLeft.hours)}</span>
        <span className="text-[9px] uppercase" style={{ color: "var(--on-surface-disabled)" }}>Hrs</span>
      </div>
      <span className="text-lg mx-0.5" style={{ color: "var(--on-surface-disabled)" }}>:</span>
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold leading-none" style={{ color: "var(--warning)" }}>{pad(timeLeft.mins)}</span>
        <span className="text-[9px] uppercase" style={{ color: "var(--on-surface-disabled)" }}>Mins</span>
      </div>
      {timeLeft.days === 0 && (
        <>
          <span className="text-lg mx-0.5" style={{ color: "var(--on-surface-disabled)" }}>:</span>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold leading-none" style={{ color: "var(--warning)" }}>{pad(timeLeft.secs)}</span>
            <span className="text-[9px] uppercase" style={{ color: "var(--on-surface-disabled)" }}>Secs</span>
          </div>
        </>
      )}
    </div>
  );
}

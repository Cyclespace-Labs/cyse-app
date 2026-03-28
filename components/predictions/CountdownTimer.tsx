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
            <span className="text-[#ff4d4f] text-xl font-bold leading-none">{pad(timeLeft.days)}</span>
            <span className="text-[#5a5a6a] text-[9px] uppercase">Days</span>
          </div>
          <span className="text-[#5a5a6a] text-lg mx-0.5">:</span>
        </>
      )}
      <div className="flex flex-col items-center">
        <span className="text-[#ff4d4f] text-xl font-bold leading-none">{pad(timeLeft.hours)}</span>
        <span className="text-[#5a5a6a] text-[9px] uppercase">Hrs</span>
      </div>
      <span className="text-[#5a5a6a] text-lg mx-0.5">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[#ff4d4f] text-xl font-bold leading-none">{pad(timeLeft.mins)}</span>
        <span className="text-[#5a5a6a] text-[9px] uppercase">Mins</span>
      </div>
      {timeLeft.days === 0 && (
        <>
          <span className="text-[#5a5a6a] text-lg mx-0.5">:</span>
          <div className="flex flex-col items-center">
            <span className="text-[#ff4d4f] text-xl font-bold leading-none">{pad(timeLeft.secs)}</span>
            <span className="text-[#5a5a6a] text-[9px] uppercase">Secs</span>
          </div>
        </>
      )}
    </div>
  );
}

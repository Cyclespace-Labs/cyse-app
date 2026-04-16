"use client";

import { useEffect, useCallback, useRef, useState } from "react";

type IdleAction = "warn" | "disconnect";

interface UseIdleTimerOptions {
  timeout?: number; // milliseconds before action
  action?: IdleAction;
  onTimeout?: () => void;
  onWarning?: () => void;
  warningDuration?: number; // milliseconds before action after warning
  disabled?: boolean;
}

interface IdleTimerState {
  isIdle: boolean;
  isWarning: boolean;
  timeRemaining: number;
  reset: () => void;
}

export function useIdleTimer({
  timeout = 30 * 60 * 1000, // 30 minutes default
  action = "disconnect",
  onTimeout,
  onWarning,
  warningDuration = 60 * 1000, // 1 minute warning
  disabled = false,
}: UseIdleTimerOptions): IdleTimerState {
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (disabled) return;

    clearTimers();
    setIsIdle(false);
    setIsWarning(false);
    setTimeRemaining(timeout);
    lastActivityRef.current = Date.now();

    // Set warning timer
    if (action === "disconnect" && warningDuration > 0) {
      warningTimerRef.current = setTimeout(() => {
        setIsWarning(true);
        onWarning?.();
      }, timeout - warningDuration);
    }

    // Set main timeout
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
      onTimeout?.();
    }, timeout);
  }, [disabled, timeout, action, warningDuration, onTimeout, onWarning, clearTimers]);

  // Update time remaining display
  useEffect(() => {
    if (disabled || isIdle) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeout - elapsed);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [disabled, isIdle, timeout]);

  // Activity event handlers
  useEffect(() => {
    if (disabled) return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      if (!isIdle) {
        reset();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    reset();

    return () => {
      clearTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [disabled, isIdle, reset, clearTimers]);

  return {
    isIdle,
    isWarning,
    timeRemaining,
    reset,
  };
}

export default useIdleTimer;

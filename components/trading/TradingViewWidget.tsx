"use client";

import { useEffect, useRef, memo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

// ── Our timeframe labels → TradingView interval codes ─────────────────────────
const TV_INTERVALS: Record<string, string> = {
  "1m": "1", "3m": "3", "5m": "5", "15m": "15", "30m": "30",
  "1h": "60", "2h": "120", "4h": "240", "6h": "360",
  "1d": "D", "1w": "W", "1M": "M",
};

// ── Map our symbols to TradingView EXCHANGE:PAIR format ───────────────────────
const TV_SYMBOLS: Record<string, string> = {
  ETH:  "BINANCE:ETHUSDT",
  BTC:  "BINANCE:BTCUSDT",
  BNB:  "BINANCE:BNBUSDT",
  SOL:  "BINANCE:SOLUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  ARB:  "BINANCE:ARBUSDT",
  OP:   "BINANCE:OPUSDT",
  XRP:  "BINANCE:XRPUSDT",
  LINK: "BINANCE:LINKUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  SUI:  "BINANCE:SUIUSDT",
  APT:  "BINANCE:APTUSDT",
  SEI:  "BINANCE:SEIUSDT",
  WIF:  "BINANCE:WIFUSDT",
  BONK: "BINANCE:BONKUSDT",
  HYPE: "BINANCE:HYPEUSDT",
  JUP:  "BINANCE:JUPUSDT",
  PENGU: "BINANCE:PENGUUSDT",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { TradingView?: any; } }

// ── Singleton script loader ───────────────────────────────────────────────────
let scriptPromise: Promise<void> | null = null;
function ensureTVScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.TradingView) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://s.tradingview.com/tv.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("TradingView script failed")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface TradingViewWidgetProps {
  symbol: string;
  interval: string;
  studies?: string[];
  onReady?: () => void;
  onError?: () => void;
}

function TradingViewWidgetInner({
  symbol,
  interval,
  studies,
  onReady,
  onError,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const studiesKey = studies?.join(",") ?? "";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const containerId = `tv_${Math.random().toString(36).slice(2, 9)}`;
    el.innerHTML = "";
    const inner = document.createElement("div");
    inner.id = containerId;
    inner.style.width = "100%";
    inner.style.height = "100%";
    el.appendChild(inner);

    let cancelled = false;

    const tvSymbol = TV_SYMBOLS[symbol.toUpperCase()] ?? `BINANCE:${symbol.toUpperCase()}USDT`;
    const tvInterval = TV_INTERVALS[interval] ?? "15";
    const isDark = theme === "dark";

    ensureTVScript()
      .then(() => {
        if (cancelled || !document.getElementById(containerId)) return;
        try {
          new window.TradingView.widget({
            autosize: true,
            symbol: tvSymbol,
            interval: tvInterval,
            timezone: "Etc/UTC",
            theme: isDark ? "dark" : "light",
            style: "1",
            locale: "en",
            enable_publishing: false,
            allow_symbol_change: false,
            hide_top_toolbar: true,
            hide_side_toolbar: false,
            withdateranges: true,
            save_image: true,
            details: false,
            hotlist: false,
            calendar: false,
            container_id: containerId,
            studies: studies ?? [],
            toolbar_bg: isDark ? "#0c0f14" : "#ffffff",
            overrides: isDark
              ? {
                  "paneProperties.background": "#0c0f14",
                  "paneProperties.backgroundType": "solid",
                  "scalesProperties.backgroundColor": "#0c0f14",
                  "scalesProperties.textColor": "#5a5d70",
                  "mainSeriesProperties.candleStyle.upColor": "#00c076",
                  "mainSeriesProperties.candleStyle.downColor": "#ff4d4f",
                  "mainSeriesProperties.candleStyle.borderUpColor": "#00c076",
                  "mainSeriesProperties.candleStyle.borderDownColor": "#ff4d4f",
                  "mainSeriesProperties.candleStyle.wickUpColor": "#00c076cc",
                  "mainSeriesProperties.candleStyle.wickDownColor": "#ff4d4fcc",
                }
              : {},
          });
          onReady?.();
        } catch (err) {
          console.error("[TradingViewWidget] create error:", err);
          onError?.();
        }
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
      if (el) el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval, theme, studiesKey]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default memo(TradingViewWidgetInner);

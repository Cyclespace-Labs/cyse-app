export const COLORS = {
  bg: "#000000",
  bgCard: "#0b0b0e",
  bgHover: "#111118",
  bgInput: "#12121a",
  border: "#1c1c28",
  borderLight: "#2a2a3a",
  textPrimary: "#ffffff",
  textSecondary: "#8a8a9a",
  textMuted: "#5a5a6a",
  green: "#00c076",
  greenBg: "rgba(0, 192, 118, 0.12)",
  red: "#ff4d4f",
  redBg: "rgba(255, 77, 79, 0.12)",
  accent: "#6366f1",
  yellow: "#f5c518",
} as const;

export const NAV_ITEMS = ["Spot", "Futures", "Lend", "Vault", "BP", "More"] as const;

export const CHART_TABS = ["Chart", "Depth", "Margin", "Funding", "Market Info"] as const;

export const TIMEFRAMES = ["1m", "3m", "5m", "15m", "1h", "4h", "1d"] as const;

export const BOTTOM_TABS = [
  "Balances",
  "Positions",
  "Open Orders",
  "Borrows",
  "TWAP",
  "Fill History",
  "Order History",
  "Position History",
  "Funding History",
] as const;

export const ORDER_TYPES = ["Limit", "Market", "Conditional"] as const;

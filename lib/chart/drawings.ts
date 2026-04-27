// ── Drawing system for lightweight-charts canvas overlay ──────────────────────
// Provides types, point-count requirements, and a full canvas renderer for
// every drawing tool: lines, channels, fibonacci, shapes, patterns, forecasting,
// annotations, and measurement tools.

import type { IChartApi, ISeriesApi } from "lightweight-charts";

// ── Drawing tool IDs ─────────────────────────────────────────────────────────
export type DrawingToolId =
  // Cursor
  | "cursor" | "crosshair"
  // Lines
  | "trendline" | "ray" | "extended_line" | "hline" | "vline" | "arrow"
  // Channels
  | "parallel_channel" | "regression_channel"
  // Fibonacci
  | "fib_retrace" | "fib_extension" | "fib_channel" | "fib_time_zone"
  // Shapes
  | "rect" | "circle" | "ellipse" | "triangle" | "arc"
  // Patterns
  | "xabcd" | "head_shoulders" | "cypher"
  // Forecasting
  | "long_position" | "short_position" | "projection"
  // Annotations
  | "text" | "callout" | "price_label" | "note" | "anchored_note"
  // Measurement
  | "price_range" | "date_range" | "date_price_range"
  // Actions (non-drawing)
  | "erase_all";

// ── Drawing data ─────────────────────────────────────────────────────────────
export interface DrawingPoint {
  time: number;
  price: number;
}

export interface Drawing {
  id: string;
  type: DrawingToolId;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  text?: string;
}

// ── Points required to complete each tool (0 = not a drawing tool) ───────────
export const TOOL_POINTS: Partial<Record<DrawingToolId, number>> = {
  trendline: 2, ray: 2, extended_line: 2, hline: 1, vline: 1, arrow: 2,
  parallel_channel: 3, regression_channel: 2,
  fib_retrace: 2, fib_extension: 3, fib_channel: 3, fib_time_zone: 2,
  rect: 2, circle: 2, ellipse: 2, triangle: 3, arc: 3,
  xabcd: 5, head_shoulders: 7, cypher: 4,
  long_position: 2, short_position: 2, projection: 3,
  text: 1, callout: 2, price_label: 1, note: 1, anchored_note: 1,
  price_range: 2, date_range: 2, date_price_range: 2,
};

export function isDrawingTool(tool: DrawingToolId): boolean {
  return (TOOL_POINTS[tool] ?? 0) > 0;
}

// ── Coordinate converter ─────────────────────────────────────────────────────
export interface CoordConverter {
  timeToX: (time: number) => number | null;
  priceToY: (price: number) => number | null;
}

export function makeConverter(
  chart: IChartApi,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any>,
): CoordConverter {
  return {
    timeToX: (time: number) => {
      try { return chart.timeScale().timeToCoordinate(time as unknown as never); }
      catch { return null; }
    },
    priceToY: (price: number) => {
      try { return series.priceToCoordinate(price); }
      catch { return null; }
    },
  };
}

// ── Factory ──────────────────────────────────────────────────────────────────
let _idCtr = 0;
export function createDrawing(
  type: DrawingToolId,
  points: DrawingPoint[],
  color = "#FFFFFFCC",
  lineWidth = 1,
  text?: string,
): Drawing {
  return {
    id: `${type}-${Date.now()}-${++_idCtr}`,
    type, points, color, lineWidth, lineStyle: "solid", text,
  };
}

// ── Fib constants ────────────────────────────────────────────────────────────
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = ["#787B86", "#F44336", "#FF9800", "#4CAF50", "#00BCD4", "#2196F3", "#787B86"];

// ── Canvas rendering ─────────────────────────────────────────────────────────
type Pt = [number, number];

function toXY(pt: DrawingPoint, c: CoordConverter): Pt | null {
  const x = c.timeToX(pt.time);
  const y = c.priceToY(pt.price);
  if (x == null || y == null) return null;
  return [x, y];
}

function setStroke(ctx: CanvasRenderingContext2D, d: Drawing) {
  ctx.strokeStyle = d.color;
  ctx.lineWidth = d.lineWidth;
  if (d.lineStyle === "dashed") ctx.setLineDash([6, 3]);
  else if (d.lineStyle === "dotted") ctx.setLineDash([2, 2]);
  else ctx.setLineDash([]);
}

/** Main entry: render all drawings onto the overlay canvas. */
export function renderDrawings(
  ctx: CanvasRenderingContext2D,
  drawings: Drawing[],
  converter: CoordConverter,
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.font = "11px 'Alexandria', system-ui, sans-serif";
  for (const d of drawings) {
    ctx.save();
    renderOne(ctx, d, converter, w, h);
    ctx.restore();
  }
  ctx.restore();
}

function renderOne(ctx: CanvasRenderingContext2D, d: Drawing, c: CoordConverter, w: number, h: number) {
  const pts = d.points.map(p => toXY(p, c)).filter(Boolean) as Pt[];
  if (pts.length === 0) return;
  setStroke(ctx, d);
  ctx.fillStyle = d.color;

  switch (d.type) {
    // ── Lines ────────────────────────────────────────────────────────────
    case "trendline":
      if (pts.length >= 2) line(ctx, pts[0], pts[1]);
      break;
    case "ray":
      if (pts.length >= 2) ray(ctx, pts[0], pts[1], w, h);
      break;
    case "extended_line":
      if (pts.length >= 2) extLine(ctx, pts[0], pts[1], w, h);
      break;
    case "vline":
      if (pts.length >= 1) { ctx.beginPath(); ctx.moveTo(pts[0][0], 0); ctx.lineTo(pts[0][0], h); ctx.stroke(); }
      break;
    case "arrow":
      if (pts.length >= 2) { line(ctx, pts[0], pts[1]); arrowHead(ctx, pts[0], pts[1]); }
      break;

    // ── Channels ─────────────────────────────────────────────────────────
    case "parallel_channel":
      if (pts.length >= 3) parallelCh(ctx, pts[0], pts[1], pts[2], d.color);
      break;
    case "regression_channel":
      if (pts.length >= 2) { line(ctx, pts[0], pts[1]); }
      break;

    // ── Fibonacci ────────────────────────────────────────────────────────
    case "fib_retrace":
      if (pts.length >= 2) fibRetrace(ctx, pts[0], pts[1], d.points[0], d.points[1], c, w);
      break;
    case "fib_extension":
      if (pts.length >= 3) fibExtension(ctx, pts, d.points, c, w);
      break;
    case "fib_channel":
      if (pts.length >= 3) parallelCh(ctx, pts[0], pts[1], pts[2], d.color);
      break;
    case "fib_time_zone":
      if (pts.length >= 2) fibTimeZone(ctx, pts[0], pts[1], h, d.color);
      break;

    // ── Shapes ───────────────────────────────────────────────────────────
    case "rect":
      if (pts.length >= 2) rectShape(ctx, pts[0], pts[1], d.color);
      break;
    case "circle":
      if (pts.length >= 2) circleShape(ctx, pts[0], pts[1]);
      break;
    case "ellipse":
      if (pts.length >= 2) ellipseShape(ctx, pts[0], pts[1]);
      break;
    case "triangle":
      if (pts.length >= 3) triShape(ctx, pts[0], pts[1], pts[2], d.color);
      break;
    case "arc":
      if (pts.length >= 3) arcShape(ctx, pts[0], pts[1], pts[2]);
      break;

    // ── Patterns ─────────────────────────────────────────────────────────
    case "xabcd":
      if (pts.length >= 2) patternPoly(ctx, pts, ["X","A","B","C","D"], d.color);
      break;
    case "head_shoulders":
      if (pts.length >= 2) {
        patternPoly(ctx, pts, ["LS","T1","Head","T2","RS","T3","End"], d.color);
        if (pts.length >= 6) { ctx.setLineDash([4,2]); line(ctx, pts[1], pts[5]); ctx.setLineDash([]); }
      }
      break;
    case "cypher":
      if (pts.length >= 2) patternPoly(ctx, pts, ["X","A","B","C"], d.color);
      break;

    // ── Forecasting ──────────────────────────────────────────────────────
    case "long_position":
      if (pts.length >= 2) positionTool(ctx, pts[0], pts[1], d.points[0], d.points[1], c, w, true);
      break;
    case "short_position":
      if (pts.length >= 2) positionTool(ctx, pts[0], pts[1], d.points[0], d.points[1], c, w, false);
      break;
    case "projection":
      if (pts.length >= 3) projectionTool(ctx, pts, d.color);
      break;

    // ── Annotations ──────────────────────────────────────────────────────
    case "text": case "note": case "anchored_note":
      if (pts.length >= 1) ctx.fillText(d.text || "Text", pts[0][0], pts[0][1]);
      break;
    case "price_label":
      if (pts.length >= 1) priceLabel(ctx, pts[0], d.points[0].price);
      break;
    case "callout":
      if (pts.length >= 2) callout(ctx, pts[0], pts[1], d.text || "Callout", d.color);
      break;

    // ── Measurement ──────────────────────────────────────────────────────
    case "price_range":
      if (pts.length >= 2) priceRange(ctx, pts[0], pts[1], d.points[0], d.points[1], w);
      break;
    case "date_range":
      if (pts.length >= 2) dateRange(ctx, pts[0], pts[1], h, d.color);
      break;
    case "date_price_range":
      if (pts.length >= 2) datePriceRange(ctx, pts[0], pts[1], d.points[0], d.points[1]);
      break;

    default: break;
  }
}

// ── Primitive helpers ────────────────────────────────────────────────────────

function line(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
}

function ray(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w: number, h: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return;
  const t = Math.max(w, h) * 3;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + dx * t, b[1] + dy * t); ctx.stroke();
}

function extLine(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w: number, h: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return;
  const t = Math.max(w, h) * 3;
  ctx.beginPath();
  ctx.moveTo(a[0] - dx * t, a[1] - dy * t);
  ctx.lineTo(b[0] + dx * t, b[1] + dy * t);
  ctx.stroke();
}

function arrowHead(ctx: CanvasRenderingContext2D, from: Pt, to: Pt) {
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]), l = 10;
  ctx.beginPath();
  ctx.moveTo(to[0], to[1]);
  ctx.lineTo(to[0] - l * Math.cos(a - Math.PI / 6), to[1] - l * Math.sin(a - Math.PI / 6));
  ctx.moveTo(to[0], to[1]);
  ctx.lineTo(to[0] - l * Math.cos(a + Math.PI / 6), to[1] - l * Math.sin(a + Math.PI / 6));
  ctx.stroke();
}

function rectShape(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, color: string) {
  const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]);
  const rw = Math.abs(b[0] - a[0]), rh = Math.abs(b[1] - a[1]);
  ctx.fillStyle = color + "18"; ctx.fillRect(x, y, rw, rh);
  ctx.strokeRect(x, y, rw, rh);
}

function circleShape(ctx: CanvasRenderingContext2D, center: Pt, edge: Pt) {
  const r = Math.hypot(edge[0] - center[0], edge[1] - center[1]);
  ctx.beginPath(); ctx.arc(center[0], center[1], r, 0, Math.PI * 2); ctx.stroke();
}

function ellipseShape(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  const rx = Math.abs(b[0] - a[0]) / 2, ry = Math.abs(b[1] - a[1]) / 2;
  if (rx < 1 || ry < 1) return;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
}

function triShape(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, c: Pt, color: string) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
  ctx.fillStyle = color + "18"; ctx.fill(); ctx.stroke();
}

function arcShape(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, c: Pt) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]); ctx.stroke();
}

function parallelCh(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, c: Pt, color: string) {
  const abx = b[0] - a[0], aby = b[1] - a[1];
  const len = Math.hypot(abx, aby);
  if (len === 0) return;
  const dx = c[0] - a[0], dy = c[1] - a[1];
  const cross = (dx * aby - dy * abx) / len;
  const nx = -aby / len, ny = abx / len;
  const ox = nx * cross, oy = ny * cross;
  line(ctx, a, b);
  line(ctx, [a[0] + ox, a[1] + oy], [b[0] + ox, b[1] + oy]);
  ctx.fillStyle = color + "10";
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  ctx.lineTo(b[0] + ox, b[1] + oy); ctx.lineTo(a[0] + ox, a[1] + oy);
  ctx.closePath(); ctx.fill();
}

function fibRetrace(
  ctx: CanvasRenderingContext2D, a: Pt, b: Pt,
  pA: DrawingPoint, pB: DrawingPoint, c: CoordConverter, w: number,
) {
  for (let i = 0; i < FIB_LEVELS.length; i++) {
    const price = pA.price + (pB.price - pA.price) * FIB_LEVELS[i];
    const y = c.priceToY(price);
    if (y == null) continue;
    ctx.strokeStyle = FIB_COLORS[i]; ctx.setLineDash([4, 2]);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.fillStyle = FIB_COLORS[i];
    ctx.fillText(`${(FIB_LEVELS[i] * 100).toFixed(1)}% ($${price.toFixed(2)})`, 8, y - 4);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = "#787B86"; line(ctx, a, b);
}

function fibExtension(
  ctx: CanvasRenderingContext2D, pts: Pt[], dPts: DrawingPoint[], c: CoordConverter, w: number,
) {
  if (pts.length < 3 || dPts.length < 3) return;
  line(ctx, pts[0], pts[1]); line(ctx, pts[1], pts[2]);
  const range = dPts[1].price - dPts[0].price;
  const ext = [0, 0.618, 1, 1.618, 2.618];
  for (let i = 0; i < ext.length; i++) {
    const price = dPts[2].price + range * ext[i];
    const y = c.priceToY(price);
    if (y == null) continue;
    ctx.strokeStyle = FIB_COLORS[i % FIB_COLORS.length]; ctx.setLineDash([4, 2]);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.fillStyle = FIB_COLORS[i % FIB_COLORS.length];
    ctx.fillText(`${(ext[i] * 100).toFixed(1)}%`, 8, y - 4);
  }
  ctx.setLineDash([]);
}

function fibTimeZone(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, h: number, color: string) {
  const dx = b[0] - a[0];
  if (dx === 0) return;
  const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34];
  ctx.strokeStyle = color + "80"; ctx.setLineDash([4, 2]);
  for (const f of fibs) {
    const x = a[0] + dx * f;
    if (x < 0 || x > 5000) continue;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function positionTool(
  ctx: CanvasRenderingContext2D, a: Pt, b: Pt,
  pA: DrawingPoint, pB: DrawingPoint, _c: CoordConverter, _w: number, isLong: boolean,
) {
  const boxW = Math.max(Math.abs(b[0] - a[0]), 120);
  const left = Math.min(a[0], b[0]);
  ctx.strokeStyle = "#FFFFFFCC"; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(left, a[1]); ctx.lineTo(left + boxW, a[1]); ctx.stroke();
  const topY = Math.min(a[1], b[1]), btmY = Math.max(a[1], b[1]);
  ctx.fillStyle = isLong ? "#00c07620" : "#ff4d4f20";
  ctx.fillRect(left, topY, boxW, btmY - topY);
  ctx.fillStyle = "#FFFFFFCC";
  ctx.fillText(`Entry $${pA.price.toFixed(2)}`, left + 4, a[1] - 4);
  ctx.fillText(`Target $${pB.price.toFixed(2)}`, left + 4, b[1] + (b[1] > a[1] ? 14 : -4));
  const diff = Math.abs(pB.price - pA.price);
  const pct = pA.price !== 0 ? (diff / pA.price * 100).toFixed(2) : "0";
  ctx.fillText(`${isLong ? "↑" : "↓"} ${pct}%`, left + 4, (topY + btmY) / 2 + 4);
}

function projectionTool(ctx: CanvasRenderingContext2D, pts: Pt[], color: string) {
  if (pts.length < 3) return;
  line(ctx, pts[0], pts[1]); line(ctx, pts[1], pts[2]);
  const dx = pts[1][0] - pts[0][0], dy = pts[1][1] - pts[0][1];
  const proj: Pt = [pts[2][0] + dx, pts[2][1] + dy];
  ctx.setLineDash([4, 2]); line(ctx, pts[2], proj); ctx.setLineDash([]);
  ctx.fillStyle = color; ctx.fillText("P", proj[0] + 4, proj[1] - 4);
}

function patternPoly(ctx: CanvasRenderingContext2D, pts: Pt[], labels: string[], color: string) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < Math.min(pts.length, labels.length); i++) {
    ctx.fillText(labels[i], pts[i][0] - 6, pts[i][1] - 8);
  }
}

function priceLabel(ctx: CanvasRenderingContext2D, pt: Pt, price: number) {
  const txt = `$${price.toFixed(2)}`;
  const m = ctx.measureText(txt), pad = 4;
  ctx.fillStyle = "#2A2E39";
  ctx.fillRect(pt[0] - pad, pt[1] - 12, m.width + pad * 2, 16);
  ctx.strokeRect(pt[0] - pad, pt[1] - 12, m.width + pad * 2, 16);
  ctx.fillStyle = "#FFFFFFCC";
  ctx.fillText(txt, pt[0], pt[1]);
}

function callout(ctx: CanvasRenderingContext2D, anchor: Pt, box: Pt, text: string, color: string) {
  line(ctx, anchor, box);
  const m = ctx.measureText(text), pad = 6;
  ctx.fillStyle = "#1E222D";
  ctx.fillRect(box[0], box[1] - 14, m.width + pad * 2, 20);
  ctx.strokeStyle = color;
  ctx.strokeRect(box[0], box[1] - 14, m.width + pad * 2, 20);
  ctx.fillStyle = color;
  ctx.fillText(text, box[0] + pad, box[1]);
}

function priceRange(
  ctx: CanvasRenderingContext2D, a: Pt, b: Pt,
  pA: DrawingPoint, pB: DrawingPoint, w: number,
) {
  const topY = Math.min(a[1], b[1]), btmY = Math.max(a[1], b[1]);
  ctx.fillStyle = "#FFFFFF10"; ctx.fillRect(0, topY, w, btmY - topY);
  ctx.strokeStyle = "#FFFFFF60"; ctx.setLineDash([4, 2]);
  ctx.beginPath(); ctx.moveTo(0, a[1]); ctx.lineTo(w, a[1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, b[1]); ctx.lineTo(w, b[1]); ctx.stroke();
  const diff = pB.price - pA.price;
  const pct = pA.price !== 0 ? ((diff / pA.price) * 100).toFixed(2) : "0";
  ctx.fillStyle = "#FFFFFFCC"; ctx.setLineDash([]);
  ctx.fillText(`${diff >= 0 ? "+" : ""}$${diff.toFixed(2)} (${pct}%)`, 8, (topY + btmY) / 2 + 4);
}

function dateRange(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, h: number, color: string) {
  const l = Math.min(a[0], b[0]), r = Math.max(a[0], b[0]);
  ctx.fillStyle = color + "12"; ctx.fillRect(l, 0, r - l, h);
  ctx.strokeStyle = color; ctx.setLineDash([4, 2]);
  ctx.beginPath(); ctx.moveTo(a[0], 0); ctx.lineTo(a[0], h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(b[0], 0); ctx.lineTo(b[0], h); ctx.stroke();
  ctx.setLineDash([]);
}

function datePriceRange(
  ctx: CanvasRenderingContext2D, a: Pt, b: Pt,
  pA: DrawingPoint, pB: DrawingPoint,
) {
  rectShape(ctx, a, b, "#FFFFFF");
  const diff = pB.price - pA.price;
  const pct = pA.price !== 0 ? ((diff / pA.price) * 100).toFixed(2) : "0";
  ctx.fillStyle = "#FFFFFFCC";
  ctx.fillText(`${diff >= 0 ? "+" : ""}$${diff.toFixed(2)} (${pct}%)`, (a[0] + b[0]) / 2 - 40, (a[1] + b[1]) / 2);
}

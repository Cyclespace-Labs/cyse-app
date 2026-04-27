/**
 * Pure indicator computation functions for lightweight-charts.
 * All functions accept candle data and return { time, value }[] arrays
 * ready to be set on a LineSeries or HistogramSeries.
 */

export interface TV { time: number; value: number }

// ── Simple Moving Average ────────────────────────────────────────────────────
export function computeSMA(
  candles: { time: number; close: number }[],
  period: number,
): TV[] {
  const result: TV[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

// ── Exponential Moving Average ───────────────────────────────────────────────
export function computeEMA(
  candles: { time: number; close: number }[],
  period: number,
): TV[] {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i].close;
  let ema = sum / period;
  const result: TV[] = [{ time: candles[period - 1].time, value: ema }];
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time, value: ema });
  }
  return result;
}

// ── Relative Strength Index ──────────────────────────────────────────────────
export function computeRSI(
  candles: { time: number; close: number }[],
  period = 14,
): TV[] {
  if (candles.length < period + 1) return [];
  const result: TV[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) avgGain += d;
    else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  result.push({
    time: candles[period].time,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    result.push({
      time: candles[i].time,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
    });
  }
  return result;
}

// ── MACD (12, 26, 9) ────────────────────────────────────────────────────────
export interface MACDResult {
  macd: TV[];
  signal: TV[];
  histogram: TV[];
}

export function computeMACD(
  candles: { time: number; close: number }[],
  fast = 12,
  slow = 26,
  sig = 9,
): MACDResult {
  const emaFast = computeEMA(candles, fast);
  const emaSlow = computeEMA(candles, slow);

  const slowMap = new Map(emaSlow.map((d) => [d.time, d.value]));
  const macdLine: TV[] = [];
  for (const f of emaFast) {
    const s = slowMap.get(f.time);
    if (s !== undefined) macdLine.push({ time: f.time, value: f.value - s });
  }
  if (macdLine.length < sig) return { macd: macdLine, signal: [], histogram: [] };

  // Signal = EMA of MACD values
  const k = 2 / (sig + 1);
  let sum = 0;
  for (let i = 0; i < sig; i++) sum += macdLine[i].value;
  let ema = sum / sig;
  const signal: TV[] = [{ time: macdLine[sig - 1].time, value: ema }];
  for (let i = sig; i < macdLine.length; i++) {
    ema = macdLine[i].value * k + ema * (1 - k);
    signal.push({ time: macdLine[i].time, value: ema });
  }

  const sigMap = new Map(signal.map((d) => [d.time, d.value]));
  const histogram: TV[] = [];
  for (const m of macdLine) {
    const s = sigMap.get(m.time);
    if (s !== undefined) histogram.push({ time: m.time, value: m.value - s });
  }

  return { macd: macdLine, signal, histogram };
}

// ── Bollinger Bands (20, 2) ──────────────────────────────────────────────────
export interface BBResult {
  upper: TV[];
  middle: TV[];
  lower: TV[];
}

export function computeBB(
  candles: { time: number; close: number }[],
  period = 20,
  mult = 2,
): BBResult {
  const middle = computeSMA(candles, period);
  const upper: TV[] = [];
  const lower: TV[] = [];

  for (let idx = 0; idx < middle.length; idx++) {
    const i = idx + period - 1; // index in candles[]
    const mean = middle[idx].value;
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (candles[j].close - mean) ** 2;
    }
    const sd = Math.sqrt(sumSq / period);
    upper.push({ time: middle[idx].time, value: mean + mult * sd });
    lower.push({ time: middle[idx].time, value: mean - mult * sd });
  }
  return { upper, middle, lower };
}

// ── Volume-Weighted Average Price ────────────────────────────────────────────
export function computeVWAP(
  candles: { time: number; high: number; low: number; close: number; volume: number }[],
): TV[] {
  let cumTPV = 0;
  let cumVol = 0;
  return candles.map((c) => {
    const tp = (c.high + c.low + c.close) / 3;
    cumTPV += tp * c.volume;
    cumVol += c.volume;
    return { time: c.time, value: cumVol > 0 ? cumTPV / cumVol : tp };
  });
}

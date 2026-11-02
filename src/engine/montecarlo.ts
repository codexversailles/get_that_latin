import { isNumericGrade, FAILING_GRADE } from './grades';
import { HONOR_TIERS, round4 } from './honors';
import type { Ledger, ProgramRecord, Prospectus } from './types';
import { allCourses, inScope } from './gwa';

export interface Moments {
  mean: number;
  std: number;
  /** Number of graded courses the moments were estimated from. */
  n: number;
  /** True when there was too little history and priors were used. */
  prior: boolean;
}

export const PRIOR_MEAN = 2.0;
export const PRIOR_STD = 0.35;
const MIN_STD = 0.08;

/** Unit-weighted mean & standard deviation of passing grades in scope. */
export function historicalMoments(p: Prospectus, rec: ProgramRecord, ledger: Ledger): Moments {
  let w = 0;
  let s = 0;
  let s2 = 0;
  let n = 0;
  for (const c of allCourses(p)) {
    if (!inScope(c, ledger.mode)) continue;
    const g = rec.grades[c.code];
    if (!isNumericGrade(g) || g >= FAILING_GRADE) continue;
    w += c.units;
    s += c.units * g;
    s2 += c.units * g * g;
    n++;
  }
  if (n === 0 || w === 0) return { mean: PRIOR_MEAN, std: PRIOR_STD, n: 0, prior: true };
  const mean = s / w;
  const variance = Math.max(0, s2 / w - mean * mean);
  if (n < 3) {
    // Shrink towards the prior when history is thin.
    return { mean, std: Math.max(MIN_STD, (Math.sqrt(variance) + PRIOR_STD) / 2), n, prior: true };
  }
  return { mean, std: Math.max(MIN_STD, Math.sqrt(variance)), n, prior: false };
}

export interface SimCourse {
  units: number;
  /** Optional per-course centre (e.g. from a midterm mark). */
  mean?: number;
}

export interface SimInput {
  fixedPoints: number;
  fixedUnits: number;
  remaining: SimCourse[];
  mean: number;
  std: number;
  /** Additive shift applied to the mean (negative = better). */
  shift: number;
  /** Multiplier on standard deviation. */
  volatility: number;
  /** Correlation between a run's courses (a latent "how this student does" factor). */
  rho: number;
  runs: number;
  seed: number;
  hardDisqualified: boolean;
}

export interface SimResult {
  runs: number;
  pSumma: number;
  pMagna: number;
  pCum: number;
  pAny: number;
  mean: number;
  p05: number;
  p50: number;
  p95: number;
  /** Histogram over [HIST_MIN, HIST_MAX]. */
  histogram: number[];
  histMin: number;
  binWidth: number;
  elapsedMs: number;
  deterministic: boolean;
}

export const HIST_MIN = 1.0;
export const HIST_MAX = 3.0;
export const HIST_BIN = 0.005;
const HIST_BINS = Math.round((HIST_MAX - HIST_MIN) / HIST_BIN);

/** Mulberry32 — small, fast, seedable PRNG so curves don't flicker between renders. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller transform producing standard normal variates (cached pair). */
export function gaussian(rand: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    while (u === 0) u = rand();
    const v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
}

export function runMonteCarlo(input: SimInput): SimResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const { fixedPoints, fixedUnits, remaining, runs } = input;
  const totalUnits = fixedUnits + remaining.reduce((s, c) => s + c.units, 0);
  const histogram = new Array<number>(HIST_BINS).fill(0);
  const done = (r: Partial<SimResult>): SimResult => ({
    runs,
    pSumma: 0,
    pMagna: 0,
    pCum: 0,
    pAny: 0,
    mean: NaN,
    p05: NaN,
    p50: NaN,
    p95: NaN,
    histogram,
    histMin: HIST_MIN,
    binWidth: HIST_BIN,
    elapsedMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0,
    deterministic: false,
    ...r,
  });

  if (totalUnits <= 0) return done({ runs: 0 });

  // Nothing left to sample → a single deterministic outcome.
  if (remaining.length === 0) {
    const g = fixedPoints / fixedUnits;
    const idx = Math.min(HIST_BINS - 1, Math.max(0, Math.floor((g - HIST_MIN) / HIST_BIN)));
    histogram[idx] = runs;
    const r4 = round4(g);
    const ok = !input.hardDisqualified;
    const summa = ok && r4 <= HONOR_TIERS[0].max ? 1 : 0;
    const magna = ok && !summa && r4 <= HONOR_TIERS[1].max ? 1 : 0;
    const cum = ok && !summa && !magna && r4 <= HONOR_TIERS[2].max ? 1 : 0;
    return done({ pSumma: summa, pMagna: magna, pCum: cum, pAny: summa + magna + cum, mean: g, p05: g, p50: g, p95: g, deterministic: true });
  }

  const rand = mulberry32(input.seed);
  const z = gaussian(rand);
  const mu = input.mean + input.shift;
  const sigma = Math.max(0.0001, input.std * input.volatility);
  const rho = Math.min(0.95, Math.max(0, input.rho));
  const sr = Math.sqrt(rho);
  const si = Math.sqrt(1 - rho);
  const n = remaining.length;
  const units = new Float64Array(n);
  const centres = new Float64Array(n);
  const sigmas = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = remaining[i];
    units[i] = c.units;
    // A midterm anchor narrows uncertainty for that course.
    centres[i] = c.mean !== undefined ? c.mean + input.shift : mu;
    sigmas[i] = c.mean !== undefined ? sigma * 0.5 : sigma;
  }

  const sMax = HONOR_TIERS[0].max;
  const mMax = HONOR_TIERS[1].max;
  const cMax = HONOR_TIERS[2].max;
  let cs = 0;
  let cm = 0;
  let cc = 0;
  let sum = 0;

  for (let r = 0; r < runs; r++) {
    const zr = z();
    let pts = fixedPoints;
    for (let i = 0; i < n; i++) {
      let g = centres[i] + sigmas[i] * (sr * zr + si * z());
      // Clamp to [1.00, 3.00] and snap to 0.25 steps.
      g = Math.round(g * 4) / 4;
      if (g < 1) g = 1;
      else if (g > 3) g = 3;
      pts += units[i] * g;
    }
    const gwa = pts / totalUnits;
    sum += gwa;
    const idx = Math.floor((gwa - HIST_MIN) / HIST_BIN);
    histogram[idx < 0 ? 0 : idx >= HIST_BINS ? HIST_BINS - 1 : idx]++;
    const g4 = Math.round(gwa * 10000) / 10000;
    if (g4 <= sMax) cs++;
    else if (g4 <= mMax) cm++;
    else if (g4 <= cMax) cc++;
  }

  const quantile = (q: number) => {
    const target = q * runs;
    let acc = 0;
    for (let i = 0; i < HIST_BINS; i++) {
      acc += histogram[i];
      if (acc >= target) return HIST_MIN + (i + 0.5) * HIST_BIN;
    }
    return HIST_MAX;
  };

  const k = input.hardDisqualified ? 0 : 1 / runs;
  return done({
    pSumma: cs * k,
    pMagna: cm * k,
    pCum: cc * k,
    pAny: (cs + cm + cc) * k,
    mean: sum / runs,
    p05: quantile(0.05),
    p50: quantile(0.5),
    p95: quantile(0.95),
  });
}

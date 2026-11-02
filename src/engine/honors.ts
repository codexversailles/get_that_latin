import type { HonorTierId } from './types';

export interface HonorTier {
  id: HonorTierId;
  label: string;
  short: string;
  /** Inclusive lower bound of the band (best grade). */
  min: number;
  /** Inclusive upper bound (cutoff). */
  max: number;
}

/** Official Latin honors cutoffs (GWA rounded to 4 decimals). */
export const HONOR_TIERS: readonly HonorTier[] = [
  { id: 'SUMMA', label: 'Summa Cum Laude', short: 'Summa', min: 1.0, max: 1.25 },
  { id: 'MAGNA', label: 'Magna Cum Laude', short: 'Magna', min: 1.2501, max: 1.5 },
  { id: 'CUM', label: 'Cum Laude', short: 'Cum', min: 1.5001, max: 1.75 },
];

export const HONORS_CEILING = 1.75;

/** GWA is evaluated at 4-decimal precision (matching the 1.2501 / 1.5001 band boundaries). */
export function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

export function classifyGwa(gwa: number | null): HonorTier | null {
  if (gwa === null || !Number.isFinite(gwa)) return null;
  const g = round4(gwa);
  for (const t of HONOR_TIERS) if (g <= t.max) return t;
  return null;
}

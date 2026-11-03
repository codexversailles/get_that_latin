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

export interface DeansListResult {
  qualified: boolean;
  tier: 'First Honors' | 'Second Honors' | null;
  gwa: number | null;
  gradedUnits: number;
  reason?: string;
}

/**
 * USTP Dean's List evaluation for a semester:
 * - Minimum regular sem load: usually ≥ 15 graded academic units
 * - No failing grade (5.00), Dropped (DRP), or Incomplete (INC)
 * - First Honors: GWA ≤ 1.40 (no grade below 2.00)
 * - Second Honors: GWA ≤ 1.75 (no grade below 2.25)
 */
export function classifyDeansList(
  gwa: number | null,
  subjects: Array<{ grade: number | 'INC' | 'IP' | null | undefined; units: number; isNstp?: boolean }>,
  minUnits = 12,
): DeansListResult {
  if (gwa === null || !Number.isFinite(gwa)) {
    return { qualified: false, tier: null, gwa: null, gradedUnits: 0 };
  }

  let gradedUnits = 0;
  let hasFailureOrInc = false;
  let lowestGrade = 1.0;

  for (const s of subjects) {
    if (s.isNstp) continue; // NSTP excluded per academic honors rules
    if (s.grade === 'INC' || s.grade === 5) {
      hasFailureOrInc = true;
    }
    if (typeof s.grade === 'number') {
      gradedUnits += s.units;
      if (s.grade > lowestGrade) {
        lowestGrade = s.grade;
      }
    }
  }

  if (hasFailureOrInc) {
    return { qualified: false, tier: null, gwa, gradedUnits, reason: 'Has 5.00 or INC' };
  }

  if (gradedUnits < minUnits) {
    return { qualified: false, tier: null, gwa, gradedUnits, reason: `Underloaded (< ${minUnits} units)` };
  }

  const roundedGwa = round4(gwa);

  if (roundedGwa <= 1.40 && lowestGrade <= 2.0) {
    return { qualified: true, tier: 'First Honors', gwa, gradedUnits };
  }

  if (roundedGwa <= 1.75 && lowestGrade <= 2.25) {
    return { qualified: true, tier: 'Second Honors', gwa, gradedUnits };
  }

  return { qualified: false, tier: null, gwa, gradedUnits, reason: roundedGwa > 1.75 ? 'GWA > 1.75' : 'Subject grade below cutoff' };
}

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

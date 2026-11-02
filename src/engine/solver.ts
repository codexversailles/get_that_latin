import { BEST_GRADE, WORST_PASSING } from './grades';
import { round4 } from './honors';
import type { Ledger } from './types';

export type SolverStatus =
  | 'SECURED' // any passing grade (≤ 3.00) on remaining units keeps the target (when full 4-yr curriculum is present)
  | 'FEASIBLE' // requires an average between 1.00 and 3.00
  | 'IMPOSSIBLE' // would require better than straight 1.00s
  | 'ACHIEVED' // nothing remaining, all 4+ years graded, and target met
  | 'INCOMPLETE_CURRICULUM' // nothing remaining in entered subjects, but < 4 years of grades uploaded
  | 'MISSED' // nothing remaining and target missed
  | 'DISQUALIFIED'; // a hard disqualifier exists

export interface SolverResult {
  target: number;
  status: SolverStatus;
  /** Required average on the remaining units (unclamped). Null when no units remain. */
  requiredAverage: number | null;
  /** Largest 0.25-grid grade that, held straight, satisfies the target. */
  requiredStep: number | null;
  /** Best achievable graduation GWA (straight 1.00s on remaining units). */
  bestPossibleGwa: number | null;
  /** Worst graduation GWA while still passing everything (straight 3.00s). */
  worstPassingGwa: number | null;
  /** When IMPOSSIBLE: bestPossibleGwa − target. */
  deficit: number | null;
  remainingUnits: number;
}

/**
 * Required Grade Average = (Target × Total Units − Fixed Grade Points) / Remaining Units
 *
 * "Fixed" grade points include recorded finals plus any active what-if overrides,
 * so the solver answers "given this scenario, what must the rest average?".
 */
export function solveTarget(ledger: Ledger, target: number): SolverResult {
  const { totalUnits, fixedPoints, fixedUnits, remainingUnits } = ledger;
  const base = { target, remainingUnits };

  const bestPossibleGwa = totalUnits > 0 ? (fixedPoints + BEST_GRADE * remainingUnits) / totalUnits : null;
  const worstPassingGwa = totalUnits > 0 ? (fixedPoints + WORST_PASSING * remainingUnits) / totalUnits : null;

  if (ledger.hardDisqualified) {
    return { ...base, status: 'DISQUALIFIED', requiredAverage: null, requiredStep: null, bestPossibleGwa, worstPassingGwa, deficit: null };
  }

  if (remainingUnits <= 0) {
    const final = fixedUnits > 0 ? fixedPoints / fixedUnits : null;
    if (final !== null && ledger.isGraduationComplete === false) {
      return {
        ...base,
        status: 'INCOMPLETE_CURRICULUM',
        requiredAverage: null,
        requiredStep: null,
        bestPossibleGwa: null,
        worstPassingGwa: null,
        deficit: null,
      };
    }
    const ok = final !== null && round4(final) <= target;
    return {
      ...base,
      status: ok ? 'ACHIEVED' : 'MISSED',
      requiredAverage: null,
      requiredStep: null,
      bestPossibleGwa: final,
      worstPassingGwa: final,
      deficit: ok || final === null ? null : final - target,
    };
  }

  const required = (target * totalUnits - fixedPoints) / remainingUnits;

  if (required < BEST_GRADE - 1e-9) {
    return {
      ...base,
      status: 'IMPOSSIBLE',
      requiredAverage: required,
      requiredStep: null,
      bestPossibleGwa,
      worstPassingGwa,
      deficit: bestPossibleGwa !== null ? bestPossibleGwa - target : null,
    };
  }

  const hasFullFourYearCurriculum =
    ledger.yearsWithSubjectsCount === undefined || ledger.yearsWithSubjectsCount >= 4;

  if (required >= WORST_PASSING && hasFullFourYearCurriculum) {
    return { ...base, status: 'SECURED', requiredAverage: required, requiredStep: WORST_PASSING, bestPossibleGwa, worstPassingGwa, deficit: null };
  }

  // Lower grades are better, so round DOWN onto the 0.25 grid (clamped to [1.00, 3.00]).
  const clampedReq = Math.min(WORST_PASSING, required);
  const requiredStep = Math.max(BEST_GRADE, Math.floor((clampedReq + 1e-9) * 4) / 4);
  return { ...base, status: 'FEASIBLE', requiredAverage: clampedReq, requiredStep, bestPossibleGwa, worstPassingGwa, deficit: null };
}

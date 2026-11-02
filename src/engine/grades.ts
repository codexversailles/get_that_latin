import type { GradeState } from './types';

/** Passing grade steps: 1.00 → 3.00 in 0.25 increments. */
export const PASSING_STEPS: readonly number[] = Array.from({ length: 9 }, (_, i) => 1 + i * 0.25);
export const FAILING_GRADE = 5;
export const GRADE_STEPS: readonly number[] = [...PASSING_STEPS, FAILING_GRADE];

export const BEST_GRADE = 1;
export const WORST_PASSING = 3;

export function isNumericGrade(g: GradeState | undefined): g is number {
  return typeof g === 'number';
}

export function isValidGrade(n: number): boolean {
  return GRADE_STEPS.some((s) => Math.abs(s - n) < 1e-9);
}

/** Snap any value to the nearest 0.25 passing step within [1.00, 3.00]. */
export function snapToStep(x: number): number {
  const s = Math.round(x * 4) / 4;
  return s < BEST_GRADE ? BEST_GRADE : s > WORST_PASSING ? WORST_PASSING : s;
}

/**
 * Parse free-form keyboard input into a grade state.
 * Accepts "1.25", "125", "1,25", "2", "5", "inc"/"i", "ip"/"p", "" / "-" (Not Yet Taken).
 * Returns `undefined` when the input is not a valid grade.
 */
export function parseGrade(raw: string): GradeState | undefined {
  const s = raw.trim().toLowerCase().replace(',', '.');
  if (s === '' || s === '-' || s === 'nyt' || s === 'n') return null;
  if (s === 'inc' || s === 'i') return 'INC';
  if (s === 'ip' || s === 'p') return 'IP';
  let n: number;
  if (/^\d{3}$/.test(s)) n = Number(s) / 100; // "125" → 1.25
  else if (/^\d(\.\d{1,2})?$/.test(s)) n = Number(s);
  else return undefined;
  return isValidGrade(n) ? n : undefined;
}

export function formatGrade(g: GradeState | undefined): string {
  if (g === null || g === undefined) return '';
  if (typeof g === 'number') return g.toFixed(2);
  return g;
}

/** Step a grade up/down the canonical ladder: NYT → 1.00 … 3.00 → 5.00 → INC → IP. */
const LADDER: GradeState[] = [null, ...GRADE_STEPS, 'INC', 'IP'];
export function stepGrade(g: GradeState | undefined, dir: 1 | -1): GradeState {
  const cur = g ?? null;
  const idx = LADDER.findIndex((v) => v === cur);
  const next = Math.min(LADDER.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + dir));
  return LADDER[next];
}

export function formatGwa(g: number | null | undefined, digits = 4): string {
  return g === null || g === undefined || !Number.isFinite(g) ? '—' : g.toFixed(digits);
}

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ProspectusSchema,
  buildLedger,
  classifyGwa,
  emptyRecord,
  parseGrade,
  runMonteCarlo,
  solveTarget,
  stepGrade,
  type ProgramRecord,
  type Prospectus,
} from './index';

const raw = JSON.parse(readFileSync(new URL('../../public/data/prospectuses/ustp-bsit-2022.json', import.meta.url), 'utf8'));

describe('prospectus seed', () => {
  it('validates against the schema (units, prereq references, uniqueness)', () => {
    const r = ProspectusSchema.safeParse(raw);
    if (!r.success) console.error(r.error.issues);
    expect(r.success).toBe(true);
  });
  it('has 8 semesters and a 6-unit IT 421 practicum', () => {
    const p = raw as Prospectus;
    expect(p.semesters).toHaveLength(8);
    const practicum = p.semesters.flatMap((s) => s.courses).find((c) => c.code === 'IT 421');
    expect(practicum?.units).toBe(6);
    expect(practicum?.category).toBe('PRACTICUM');
  });
});

const p = ProspectusSchema.parse(raw);

function rec(grades: ProgramRecord['grades'], extra: Partial<ProgramRecord> = {}): ProgramRecord {
  return { ...emptyRecord(), grades, ...extra };
}

describe('grades', () => {
  it('parses keyboard shorthand', () => {
    expect(parseGrade('125')).toBe(1.25);
    expect(parseGrade('1.5')).toBe(1.5);
    expect(parseGrade('5')).toBe(5);
    expect(parseGrade('inc')).toBe('INC');
    expect(parseGrade('ip')).toBe('IP');
    expect(parseGrade('')).toBeNull();
    expect(parseGrade('1.3')).toBeUndefined();
    expect(parseGrade('4')).toBeUndefined();
  });
  it('steps along the ladder', () => {
    expect(stepGrade(null, 1)).toBe(1);
    expect(stepGrade(3, 1)).toBe(5);
    expect(stepGrade(1, -1)).toBeNull();
  });
});

describe('honors classification', () => {
  it('uses 4-decimal cutoffs', () => {
    expect(classifyGwa(1.25)?.id).toBe('SUMMA');
    expect(classifyGwa(1.25004)?.id).toBe('SUMMA');
    expect(classifyGwa(1.2501)?.id).toBe('MAGNA');
    expect(classifyGwa(1.5)?.id).toBe('MAGNA');
    expect(classifyGwa(1.75)?.id).toBe('CUM');
    expect(classifyGwa(1.7501)).toBeNull();
  });
});

describe('ledger', () => {
  it('computes unit-weighted GWA and excludes NSTP in academic mode', () => {
    const r = rec({ 'IT 111': 1.0, 'IT 112': 2.0, 'PATHFit 1': 1.5, 'NSTP 101b': 3.0 });
    const a = buildLedger(p, r, 'academic');
    expect(a.completedUnits).toBe(8);
    expect(a.gwa).toBeCloseTo((3 * 1 + 3 * 2 + 2 * 1.5) / 8, 10);
    expect(a.totalUnits).toBe(149);
    const i = buildLedger(p, r, 'institutional');
    expect(i.completedUnits).toBe(11);
    expect(i.gwa).toBeCloseTo((3 + 6 + 3 + 9) / 11, 10);
    expect(i.totalUnits).toBe(155);
  });
  it('flags 5.00 as hard and INC as pending disqualifiers', () => {
    const l = buildLedger(p, rec({ 'IT 111': 5, 'IT 112': 'INC' }), 'academic');
    expect(l.hardDisqualified).toBe(true);
    expect(l.disqualifiers.map((d) => d.severity).sort()).toEqual(['hard', 'pending']);
  });
  it('treats what-if overrides as fixed points', () => {
    const l = buildLedger(p, rec({}, { whatIf: { 'IT 421': 1.0 } }), 'academic');
    expect(l.fixedUnits).toBe(6);
    expect(l.remainingUnits).toBe(143);
  });
});

describe('target solver', () => {
  it('solves Required = (T·U − P) / R', () => {
    const r = rec({ 'IT 111': 1.5, 'IT 112': 1.5 }); // 6u, 9 pts
    const l = buildLedger(p, r, 'academic');
    const s = solveTarget(l, 1.5);
    expect(s.requiredAverage).toBeCloseTo((1.5 * 149 - 9) / 143, 10);
    expect(s.status).toBe('FEASIBLE');
  });
  it('reports impossibility with deficit and best reachable GWA', () => {
    const grades: ProgramRecord['grades'] = {};
    for (const c of p.semesters.slice(0, 6).flatMap((s) => s.courses)) grades[c.code] = 2.0;
    const l = buildLedger(p, rec(grades), 'academic');
    const s = solveTarget(l, 1.25);
    expect(s.status).toBe('IMPOSSIBLE');
    const best = (l.fixedPoints + l.remainingUnits) / l.totalUnits;
    expect(s.bestPossibleGwa).toBeCloseTo(best, 10);
    expect(s.deficit).toBeCloseTo(best - 1.25, 10);
  });
  it('reports SECURED when straight 3.00s still meet the target', () => {
    const grades: ProgramRecord['grades'] = {};
    for (const c of p.semesters.slice(0, 7).flatMap((s) => s.courses)) grades[c.code] = 1.0;
    const s = solveTarget(buildLedger(p, rec(grades), 'academic'), 1.75);
    expect(s.status).toBe('SECURED');
  });
});

describe('monte carlo', () => {
  const base = { fixedPoints: 60, fixedUnits: 50, mean: 1.3, std: 0.2, shift: 0, volatility: 1, rho: 0.3, runs: 20000, seed: 42, hardDisqualified: false };
  const remaining = Array.from({ length: 30 }, () => ({ units: 3 }));

  it('is deterministic for a fixed seed and probabilities sum to pAny', () => {
    const a = runMonteCarlo({ ...base, remaining });
    const b = runMonteCarlo({ ...base, remaining });
    expect(a.pAny).toBe(b.pAny);
    expect(a.pSumma + a.pMagna + a.pCum).toBeCloseTo(a.pAny, 10);
    expect(a.histogram.reduce((s, x) => s + x, 0)).toBe(20000);
  });
  it('zeroes probabilities when hard-disqualified', () => {
    const r = runMonteCarlo({ ...base, remaining, hardDisqualified: true });
    expect(r.pAny).toBe(0);
  });
  it('responds to performance shift', () => {
    const better = runMonteCarlo({ ...base, remaining, shift: -0.2 });
    const worse = runMonteCarlo({ ...base, remaining, shift: 0.3 });
    expect(better.pSumma).toBeGreaterThan(worse.pSumma);
  });
  it('runs 50k simulations quickly', () => {
    const r = runMonteCarlo({ ...base, remaining: Array.from({ length: 50 }, () => ({ units: 3 })), runs: 50000 });
    expect(r.elapsedMs).toBeLessThan(1500);
  });
});

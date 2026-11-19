import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, createInitialYears, parseState, type AppState } from './storage';
import { reducer } from './state';
import { buildExport } from './transfer';

function freshState(): AppState {
  return {
    ...DEFAULT_STATE,
    years: createInitialYears(),
    settings: { ...DEFAULT_STATE.settings, sim: { ...DEFAULT_STATE.settings.sim } },
  };
}

describe('storage schema validation', () => {
  it('accepts valid state and preserves institutional honorsMode', () => {
    const s: AppState = {
      ...freshState(),
      settings: { ...DEFAULT_STATE.settings, honorsMode: 'institutional' },
    };
    s.years[0].semesters[0].subjects.push({
      id: 'sub-1',
      name: 'IT 111',
      units: 3,
      grade: 1.25,
      whatIf: null,
      isNstp: false,
    });
    const parsed = parseState(s);
    expect(parsed).not.toBeNull();
    expect(parsed?.settings.honorsMode).toBe('institutional');
  });

  it('rejects out-of-scale numeric grades and invalid whatIf grades', () => {
    const badGrade = freshState();
    badGrade.years[0].semesters[0].subjects.push({
      id: 'sub-bad',
      name: 'IT 111',
      units: 3,
      grade: 1.33,
    });
    expect(parseState(badGrade)).toBeNull();

    const badWhatIf = freshState();
    badWhatIf.years[0].semesters[0].subjects.push({
      id: 'sub-bad-whatif',
      name: 'IT 112',
      units: 3,
      grade: null,
      whatIf: 5.0,
    });
    expect(parseState(badWhatIf)).toBeNull();
  });
});

describe('state reducer', () => {
  it('adds and resequences years and semesters on removal', () => {
    let s = freshState();
    s = reducer(s, { type: 'addYear' });
    expect(s.years.map((y) => y.label)).toEqual(['1st Year', '2nd Year']);

    const firstYearId = s.years[0].id;
    s = reducer(s, { type: 'removeYear', yearId: firstYearId });
    expect(s.years).toHaveLength(1);
    expect(s.years[0].label).toBe('1st Year');

    const sem1Id = s.years[0].semesters[0].id;
    s = reducer(s, { type: 'removeSemester', yearId: s.years[0].id, semId: sem1Id });
    expect(s.years[0].semesters).toHaveLength(1);
    expect(s.years[0].semesters[0].name).toBe('1st Semester');
  });

  it('clears whatIf when a final numeric grade is recorded', () => {
    let s = freshState();
    const yId = s.years[0].id;
    const semId = s.years[0].semesters[0].id;
    s = reducer(s, { type: 'addSubject', yearId: yId, semId, name: 'IT 111', units: 3, grade: null });
    const subId = s.years[0].semesters[0].subjects[0].id;

    s = reducer(s, { type: 'updateSubject', subId, patch: { whatIf: 1.25 } });
    expect(s.years[0].semesters[0].subjects[0].whatIf).toBe(1.25);

    s = reducer(s, { type: 'updateSubject', subId, patch: { grade: 1.5 } });
    expect(s.years[0].semesters[0].subjects[0].grade).toBe(1.5);
    expect(s.years[0].semesters[0].subjects[0].whatIf).toBeNull();
  });
});

describe('transfer export', () => {
  it('builds a valid export whose embedded state round-trips through parseState', () => {
    let s = freshState();
    const yId = s.years[0].id;
    const semId = s.years[0].semesters[0].id;
    s = reducer(s, { type: 'addSubject', yearId: yId, semId, name: 'IT 111', units: 3, grade: 1.25 });

    const exported = buildExport(s);
    expect(exported.app).toBe('GetThatLatin');
    expect(exported.summary).toHaveLength(2);
    expect(exported.summary[0].gwa).toBeCloseTo(1.25, 6);
    expect(parseState(exported.state)).toEqual(s);
  });
});

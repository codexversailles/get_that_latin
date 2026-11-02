import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { GradeState, HonorsMode, StudentSemester, StudentSubject, StudentYear } from '../engine';
import {
  DEFAULT_STATE,
  STORAGE_KEY,
  clearStoredState,
  createInitialYears,
  loadState,
  parseState,
  saveState,
  type AppState,
  type SimSettings,
} from './storage';

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export function yearLabelFor(idx: number): string {
  return `${ORDINAL[idx] ?? `${idx + 1}th`} Year`;
}

export function semNameFor(idx: number): string {
  if (idx === 0) return '1st Semester';
  if (idx === 1) return '2nd Semester';
  if (idx === 2) return 'Midyear / Summer';
  return `${ORDINAL[idx] ?? `${idx + 1}th`} Semester`;
}

/** Re-index all years and their semesters sequentially so deleting Year 1 shifts Year 2 → Year 1, and deleting Sem 1 shifts Sem 2 → Sem 1. */
function resequenceYears(years: StudentYear[]): StudentYear[] {
  return years.map((y, yIdx) => ({
    ...y,
    label: yearLabelFor(yIdx),
    semesters: resequenceSemesters(y.semesters),
  }));
}

function resequenceSemesters(semesters: StudentSemester[]): StudentSemester[] {
  return semesters.map((sem, sIdx) => ({
    ...sem,
    name: semNameFor(sIdx),
  }));
}

let idCounter = 0;
function uid(prefix: string): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export type Action =
  | { type: 'addYear' }
  | { type: 'removeYear'; yearId: string }
  | { type: 'addSemester'; yearId: string }
  | { type: 'removeSemester'; yearId: string; semId: string }
  | {
      type: 'addSubject';
      yearId: string;
      semId: string;
      name: string;
      units: number;
      grade: GradeState;
      isNstp?: boolean;
    }
  | {
      type: 'updateSubject';
      subId: string;
      patch: Partial<Pick<StudentSubject, 'name' | 'units' | 'grade' | 'whatIf' | 'isNstp'>>;
    }
  | { type: 'removeSubject'; subId: string }
  | { type: 'clearAllWhatIf' }
  | { type: 'setHonorsMode'; mode: HonorsMode }
  | { type: 'setTarget'; target: number }
  | { type: 'setSim'; patch: Partial<SimSettings> }
  | { type: 'replace'; state: AppState }
  | { type: 'clearAll' };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'addYear': {
      const nextIdx = s.years.length;
      const yId = uid('year');
      return {
        ...s,
        years: resequenceYears([
          ...s.years,
          {
            id: yId,
            label: yearLabelFor(nextIdx),
            semesters: [
              { id: uid('sem'), name: '1st Semester', subjects: [] },
              { id: uid('sem'), name: '2nd Semester', subjects: [] },
            ],
          },
        ]),
      };
    }
    case 'removeYear': {
      const remaining = s.years.filter((y) => y.id !== a.yearId);
      return {
        ...s,
        years: remaining.length > 0 ? resequenceYears(remaining) : createInitialYears(),
      };
    }
    case 'addSemester':
      return {
        ...s,
        years: s.years.map((y) => {
          if (y.id !== a.yearId) return y;
          return {
            ...y,
            semesters: resequenceSemesters([
              ...y.semesters,
              { id: uid('sem'), name: semNameFor(y.semesters.length), subjects: [] },
            ]),
          };
        }),
      };
    case 'removeSemester':
      return {
        ...s,
        years: s.years.map((y) => {
          if (y.id !== a.yearId) return y;
          const remaining = y.semesters.filter((sem) => sem.id !== a.semId);
          return {
            ...y,
            semesters:
              remaining.length > 0
                ? resequenceSemesters(remaining)
                : [{ id: uid('sem'), name: '1st Semester', subjects: [] }],
          };
        }),
      };
    case 'addSubject':
      return {
        ...s,
        years: s.years.map((y) =>
          y.id !== a.yearId
            ? y
            : {
                ...y,
                semesters: y.semesters.map((sem) =>
                  sem.id !== a.semId
                    ? sem
                    : {
                        ...sem,
                        subjects: [
                          ...sem.subjects,
                          {
                            id: uid('sub'),
                            name: a.name.trim() || `Subject ${sem.subjects.length + 1}`,
                            units: a.units > 0 ? a.units : 3,
                            grade: a.grade,
                            isNstp: !!a.isNstp,
                          },
                        ],
                      },
                ),
              },
        ),
      };
    case 'updateSubject':
      return {
        ...s,
        years: s.years.map((y) => ({
          ...y,
          semesters: y.semesters.map((sem) => ({
            ...sem,
            subjects: sem.subjects.map((sub) => {
              if (sub.id !== a.subId) return sub;
              const next = { ...sub, ...a.patch };
              if (typeof next.grade === 'number') {
                next.whatIf = null;
              }
              return next;
            }),
          })),
        })),
      };
    case 'removeSubject':
      return {
        ...s,
        years: s.years.map((y) => ({
          ...y,
          semesters: y.semesters.map((sem) => ({
            ...sem,
            subjects: sem.subjects.filter((sub) => sub.id !== a.subId),
          })),
        })),
      };
    case 'clearAllWhatIf':
      return {
        ...s,
        years: s.years.map((y) => ({
          ...y,
          semesters: y.semesters.map((sem) => ({
            ...sem,
            subjects: sem.subjects.map((sub) => ({ ...sub, whatIf: null })),
          })),
        })),
      };
    case 'setHonorsMode':
      return { ...s, settings: { ...s.settings, honorsMode: a.mode } };
    case 'setTarget':
      return { ...s, settings: { ...s.settings, target: a.target } };
    case 'setSim':
      return { ...s, settings: { ...s.settings, sim: { ...s.settings.sim, ...a.patch } } };
    case 'replace':
      return a.state;
    case 'clearAll':
      return { ...DEFAULT_STATE, years: createInitialYears() };
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const timer = useRef<number | undefined>(undefined);
  const dirty = useRef(false);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) {
      cleared.current = false;
      dirty.current = false;
      return;
    }
    dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      dirty.current = false;
      saveState(state);
    }, 150);
    return () => window.clearTimeout(timer.current);
  }, [state]);

  useEffect(() => {
    const flush = () => {
      if (dirty.current) saveState(state);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = e.newValue ? parseState(safeJson(e.newValue)) : null;
      cleared.current = true;
      dispatch({ type: 'replace', state: next ?? { ...DEFAULT_STATE, years: createInitialYears() } });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const clearAll = useCallback(() => {
    clearStoredState();
    cleared.current = true;
    dispatch({ type: 'clearAll' });
  }, []);

  return { state, dispatch, clearAll };
}

export type Dispatch = ReturnType<typeof useAppState>['dispatch'];

import { z } from 'zod';
import type { HonorsMode, StudentYear } from '../engine';

export const STORAGE_KEY = 'getthatlatin_records_v1';

export interface SimSettings {
  shift: number;
  volatility: number;
  rho: number;
  runs: number;
}

export interface AppState {
  version: 2;
  years: StudentYear[];
  settings: {
    honorsMode: HonorsMode;
    target: number;
    sim: SimSettings;
  };
}

export const DEFAULT_SIM: SimSettings = { shift: 0, volatility: 1, rho: 0.35, runs: 30000 };

export function createInitialYears(): StudentYear[] {
  return [
    {
      id: 'year-1',
      label: '1st Year',
      semesters: [
        { id: 'year-1-sem-1', name: '1st Semester', subjects: [] },
        { id: 'year-1-sem-2', name: '2nd Semester', subjects: [] },
      ],
    },
  ];
}

export const DEFAULT_STATE: AppState = {
  version: 2,
  years: createInitialYears(),
  settings: { honorsMode: 'academic', target: 1.75, sim: DEFAULT_SIM },
};

const GradeValue = z.union([z.number(), z.literal('INC'), z.literal('IP'), z.null()]);

const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  units: z.number().positive(),
  grade: GradeValue.default(null),
  whatIf: z.number().nullable().optional(),
  isNstp: z.boolean().optional(),
});

const SemesterSchema = z.object({
  id: z.string(),
  name: z.string(),
  subjects: z.array(SubjectSchema),
});

const YearSchema = z.object({
  id: z.string(),
  label: z.string(),
  semesters: z.array(SemesterSchema),
});

export const AppStateSchema = z.object({
  version: z.literal(2),
  years: z.array(YearSchema),
  settings: z.object({
    honorsMode: z.enum(['academic', 'institutional']),
    target: z.number().min(1).max(3),
    sim: z.object({
      shift: z.number().min(-1).max(1),
      volatility: z.number().min(0.1).max(4),
      rho: z.number().min(0).max(0.95),
      runs: z.number().int().min(1000).max(100000),
    }),
  }),
});

export function parseState(raw: unknown): AppState | null {
  const r = AppStateSchema.safeParse(raw);
  return r.success ? (r.data as AppState) : null;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return parseState(JSON.parse(raw)) ?? DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
}

export function clearStoredState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

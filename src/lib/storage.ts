import { z } from 'zod';
import { isValidGrade, isValidPassingGrade, type HonorsMode, type StudentYear } from '../engine';

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

const ValidGradeNumber = z.number().refine(isValidGrade, {
  message: 'Grade must be on the 1.00–3.00 (0.25 step) or 5.00 scale',
});

const ValidWhatIfNumber = z.number().refine(isValidPassingGrade, {
  message: 'What-If grade must be on the 1.00–3.00 (0.25 step) scale',
});

const GradeValue = z.union([ValidGradeNumber, z.literal('INC'), z.literal('IP'), z.null()]);

const SubjectSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  units: z.number().positive(),
  grade: GradeValue.default(null),
  whatIf: ValidWhatIfNumber.nullable().optional(),
  isNstp: z.boolean().optional(),
});

const SemesterSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  subjects: z.array(SubjectSchema),
});

const YearSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  semesters: z.array(SemesterSchema).min(1),
});

export const AppStateSchema = z.object({
  version: z.literal(2),
  years: z.array(YearSchema).min(1),
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
  if (!r.success) return null;
  return r.data as AppState;
}

export function hasSavedRecords(s: AppState): boolean {
  return s.years.some((y) => y.semesters.some((sem) => sem.subjects.length > 0));
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

export function saveState(s: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

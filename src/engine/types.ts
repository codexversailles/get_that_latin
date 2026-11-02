import type { z } from 'zod';
import type { CourseSchema, ProspectusSchema, RegistryEntrySchema, SemesterSchema, COURSE_CATEGORIES } from './schema';

export type Course = z.infer<typeof CourseSchema>;
export type Semester = z.infer<typeof SemesterSchema>;
export type Prospectus = z.infer<typeof ProspectusSchema>;
export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

/**
 * A recorded grade. Numbers are official grade steps (1.00–3.00 in 0.25, or 5.00).
 * `null` / absent means Not Yet Taken (upcoming / planned subject).
 */
export type GradeState = number | 'INC' | 'IP' | null;

export type HonorsMode = 'academic' | 'institutional';

export type HonorTierId = 'SUMMA' | 'MAGNA' | 'CUM';

/** A student-added subject in their custom curriculum. */
export interface StudentSubject {
  id: string;
  name: string;
  units: number;
  grade: GradeState;
  /** Optional What-If test grade for subjects without a final numeric grade. */
  whatIf?: number | null;
  /** Marks NSTP subjects so they are excluded when Honors GWA (RA 9163) mode is active. */
  isNstp?: boolean;
}

/** A semester/term inside a student's academic year. */
export interface StudentSemester {
  id: string;
  name: string;
  subjects: StudentSubject[];
}

/** An academic year (supports 1st–4th year, 5th+ year for irregular students). */
export interface StudentYear {
  id: string;
  label: string;
  semesters: StudentSemester[];
}

/** Per-prospectus student entries (retained for engine compatibility). */
export interface ProgramRecord {
  grades: Record<string, Exclude<GradeState, null>>;
  midterms: Record<string, number>;
  whatIf: Record<string, number>;
  pinned: string[];
}

export interface Disqualifier {
  code: string;
  title: string;
  /** `hard` = a failing grade (permanent); `pending` = resolvable (e.g. INC). */
  severity: 'hard' | 'pending';
  reason: string;
}

export interface PendingCourse {
  course: Course;
  state: GradeState;
  midterm?: number;
}

export interface Ledger {
  mode: HonorsMode;
  totalUnits: number;
  /** Units with a recorded numeric final grade. */
  completedUnits: number;
  completedPoints: number;
  /** Actual GWA from recorded grades only (null when nothing is graded). */
  gwa: number | null;
  /** Units / points fixed by completed grades + what-if scenario values. */
  fixedUnits: number;
  fixedPoints: number;
  projectedGwa: number | null;
  whatIfUnits: number;
  /** Courses still undetermined (no grade and no what-if override). */
  pending: PendingCourse[];
  remainingUnits: number;
  disqualifiers: Disqualifier[];
  hardDisqualified: boolean;
}

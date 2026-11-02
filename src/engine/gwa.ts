import { FAILING_GRADE, isNumericGrade } from './grades';
import type {
  Course,
  Disqualifier,
  HonorsMode,
  Ledger,
  PendingCourse,
  ProgramRecord,
  Prospectus,
  Semester,
  StudentSemester,
  StudentSubject,
  StudentYear,
} from './types';

export function allCourses(p: Prospectus): Course[] {
  return p.semesters.flatMap((s) => s.courses);
}

/** RA 9163: NSTP is excluded from the academic-honors GWA. */
export function inScope(c: { isNstp?: boolean }, mode: HonorsMode): boolean {
  return mode === 'institutional' || !c.isNstp;
}

export function emptyRecord(): ProgramRecord {
  return { grades: {}, midterms: {}, whatIf: {}, pinned: [] };
}

/** Convert user-created years into a synthetic Prospectus + ProgramRecord so all engine functions work seamlessly. */
export function yearsToProspectusAndRecord(years: StudentYear[]): {
  prospectus: Prospectus;
  record: ProgramRecord;
} {
  const record: ProgramRecord = emptyRecord();
  let totalDegreeUnits = 0;
  let totalAcademicUnits = 0;

  const semesters: Semester[] = years.flatMap((y, yIdx) =>
    y.semesters.map((sem, sIdx) => {
      const courses: Course[] = sem.subjects.map((sub) => {
        const code = sub.id;
        totalDegreeUnits += sub.units;
        if (!sub.isNstp) totalAcademicUnits += sub.units;

        if (sub.grade !== null && sub.grade !== undefined) {
          record.grades[code] = sub.grade;
        }
        if (typeof sub.whatIf === 'number' && typeof sub.grade !== 'number') {
          record.whatIf[code] = sub.whatIf;
        }

        return {
          code,
          title: sub.name || 'Untitled Subject',
          units: sub.units,
          lectureHours: sub.units,
          labHours: 0,
          category: sub.isNstp ? 'PE_NSTP' : 'IT_PROFESSIONAL',
          isNstp: !!sub.isNstp,
          prerequisites: [],
          coRequisites: [],
        };
      });

      return {
        yearLevel: Math.min(6, Math.max(1, yIdx + 1)),
        semester: Math.min(3, Math.max(1, sIdx + 1)),
        termLabel: `${y.label} — ${sem.name}`,
        courses,
      };
    }),
  );

  return {
    prospectus: {
      programId: 'custom',
      programName: 'Custom Curriculum',
      campus: '',
      effectiveYear: new Date().getFullYear(),
      totalDegreeUnits,
      totalAcademicUnits,
      semesters,
    },
    record,
  };
}

/** Build a Ledger directly from the student's custom years. */
export function buildStudentLedger(years: StudentYear[], mode: HonorsMode): Ledger {
  const { prospectus, record } = yearsToProspectusAndRecord(years);
  return buildLedger(prospectus, record, mode);
}

/** Compute semester GWA and unit tallies for a StudentSemester. */
export function studentSemSummary(sem: StudentSemester, mode: HonorsMode): {
  gwa: number | null;
  gradedUnits: number;
  totalUnits: number;
} {
  let gradedUnits = 0;
  let totalUnits = 0;
  let points = 0;
  for (const sub of sem.subjects) {
    if (!inScope(sub, mode)) continue;
    totalUnits += sub.units;
    if (isNumericGrade(sub.grade)) {
      gradedUnits += sub.units;
      points += sub.units * sub.grade;
    }
  }
  return { gwa: gradedUnits > 0 ? points / gradedUnits : null, gradedUnits, totalUnits };
}

/** Compute year GWA and unit tallies for a StudentYear. */
export function studentYearSummary(year: StudentYear, mode: HonorsMode): {
  gwa: number | null;
  gradedUnits: number;
  totalUnits: number;
} {
  let gradedUnits = 0;
  let totalUnits = 0;
  let points = 0;
  for (const sem of year.semesters) {
    for (const sub of sem.subjects) {
      if (!inScope(sub, mode)) continue;
      totalUnits += sub.units;
      if (isNumericGrade(sub.grade)) {
        gradedUnits += sub.units;
        points += sub.units * sub.grade;
      }
    }
  }
  return { gwa: gradedUnits > 0 ? points / gradedUnits : null, gradedUnits, totalUnits };
}

/** All subjects flattened with their year/semester context. */
export function flattenSubjects(
  years: StudentYear[],
): Array<{ subject: StudentSubject; yearLabel: string; semName: string }> {
  const out: Array<{ subject: StudentSubject; yearLabel: string; semName: string }> = [];
  for (const y of years) {
    for (const s of y.semesters) {
      for (const sub of s.subjects) {
        out.push({ subject: sub, yearLabel: y.label, semName: s.name });
      }
    }
  }
  return out;
}

/** GWA = Σ(units × grade) / Σ(units). Returns null when no units are graded. */
export function weightedAverage(entries: Iterable<{ units: number; grade: number }>): number | null {
  let u = 0;
  let p = 0;
  for (const e of entries) {
    u += e.units;
    p += e.units * e.grade;
  }
  return u > 0 ? p / u : null;
}

export function buildLedger(p: Prospectus, rec: ProgramRecord, mode: HonorsMode): Ledger {
  let totalUnits = 0;
  let completedUnits = 0;
  let completedPoints = 0;
  let whatIfUnits = 0;
  let whatIfPoints = 0;
  const pending: PendingCourse[] = [];
  const disqualifiers: Disqualifier[] = [];

  for (const c of allCourses(p)) {
    if (!inScope(c, mode)) continue;
    totalUnits += c.units;
    const g = rec.grades[c.code];

    if (isNumericGrade(g)) {
      completedUnits += c.units;
      completedPoints += c.units * g;
      if (g >= FAILING_GRADE) {
        disqualifiers.push({ code: c.title, title: c.title, severity: 'hard', reason: 'Failing grade (5.00)' });
      }
      continue;
    }

    if (g === 'INC') {
      disqualifiers.push({ code: c.title, title: c.title, severity: 'pending', reason: 'Unresolved INC' });
    }

    const w = rec.whatIf[c.code];
    if (typeof w === 'number') {
      whatIfUnits += c.units;
      whatIfPoints += c.units * w;
    } else {
      pending.push({ course: c, state: g ?? null, midterm: rec.midterms[c.code] });
    }
  }

  const fixedUnits = completedUnits + whatIfUnits;
  const fixedPoints = completedPoints + whatIfPoints;
  const remainingUnits = pending.reduce((s, x) => s + x.course.units, 0);

  return {
    mode,
    totalUnits,
    completedUnits,
    completedPoints,
    gwa: completedUnits > 0 ? completedPoints / completedUnits : null,
    fixedUnits,
    fixedPoints,
    projectedGwa: fixedUnits > 0 ? fixedPoints / fixedUnits : null,
    whatIfUnits,
    pending,
    remainingUnits,
    disqualifiers,
    hardDisqualified: disqualifiers.some((d) => d.severity === 'hard'),
  };
}

export interface TermSummary {
  gwa: number | null;
  gradedUnits: number;
  totalUnits: number;
}

export function termSummary(s: Semester, rec: ProgramRecord, mode: HonorsMode): TermSummary {
  let gradedUnits = 0;
  let totalUnits = 0;
  let points = 0;
  for (const c of s.courses) {
    if (!inScope(c, mode)) continue;
    totalUnits += c.units;
    const g = rec.grades[c.code];
    if (isNumericGrade(g)) {
      gradedUnits += c.units;
      points += c.units * g;
    }
  }
  return { gwa: gradedUnits > 0 ? points / gradedUnits : null, gradedUnits, totalUnits };
}

/** Returns the prerequisite codes that do not yet have a passing final grade. */
export function unmetPrerequisites(c: Course, rec: ProgramRecord): string[] {
  return c.prerequisites.filter((code) => {
    const g = rec.grades[code];
    return !(isNumericGrade(g) && g < FAILING_GRADE);
  });
}

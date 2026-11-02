import { z } from 'zod';

export const COURSE_CATEGORIES = [
  'GE_CORE',
  'COMPUTING_COMMON',
  'IT_PROFESSIONAL',
  'IT_SPECIALIZED',
  'ELECTIVE',
  'PE_NSTP',
  'PRACTICUM',
] as const;

export const CourseSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  units: z.number().nonnegative(),
  lectureHours: z.number().nonnegative(),
  labHours: z.number().nonnegative(),
  category: z.enum(COURSE_CATEGORIES),
  /** Flags the subject for legal exclusion from academic honors (RA 9163). */
  isNstp: z.boolean(),
  prerequisites: z.array(z.string()),
  coRequisites: z.array(z.string()),
});

export const SemesterSchema = z.object({
  yearLevel: z.number().int().min(1).max(6),
  /** 1 = first, 2 = second, 3 = summer / midyear. */
  semester: z.number().int().min(1).max(3),
  termLabel: z.string().min(1),
  courses: z.array(CourseSchema).min(1),
});

const EPS = 1e-6;

export const ProspectusSchema = z
  .object({
    programId: z.string().min(1),
    programName: z.string().min(1),
    campus: z.string().min(1),
    effectiveYear: z.number().int(),
    totalDegreeUnits: z.number().positive(),
    totalAcademicUnits: z.number().positive(),
    semesters: z.array(SemesterSchema).min(1),
  })
  .superRefine((p, ctx) => {
    const codes = new Set<string>();
    let total = 0;
    let nstp = 0;
    for (const s of p.semesters) {
      for (const c of s.courses) {
        if (codes.has(c.code)) {
          ctx.addIssue({ code: 'custom', message: `Duplicate course code "${c.code}"`, path: ['semesters'] });
        }
        codes.add(c.code);
        total += c.units;
        if (c.isNstp) nstp += c.units;
      }
    }
    for (const s of p.semesters) {
      for (const c of s.courses) {
        for (const ref of [...c.prerequisites, ...c.coRequisites]) {
          if (!codes.has(ref)) {
            ctx.addIssue({ code: 'custom', message: `${c.code} references unknown course "${ref}"`, path: ['semesters'] });
          }
        }
      }
    }
    if (Math.abs(total - p.totalDegreeUnits) > EPS) {
      ctx.addIssue({
        code: 'custom',
        message: `totalDegreeUnits (${p.totalDegreeUnits}) does not match course sum (${total})`,
        path: ['totalDegreeUnits'],
      });
    }
    if (Math.abs(total - nstp - p.totalAcademicUnits) > EPS) {
      ctx.addIssue({
        code: 'custom',
        message: `totalAcademicUnits (${p.totalAcademicUnits}) does not match non-NSTP sum (${total - nstp})`,
        path: ['totalAcademicUnits'],
      });
    }
  });

export const RegistryEntrySchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  programName: z.string().min(1),
  shortName: z.string().min(1),
  campus: z.string().min(1),
  effectiveYear: z.number().int(),
});

export const RegistrySchema = z.object({
  version: z.number().int(),
  prospectuses: z.array(RegistryEntrySchema).min(1),
});

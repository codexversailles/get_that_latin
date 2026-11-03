import { memo, useState, type FormEvent } from 'react';
import { Award, CalendarPlus, Plus, Trash2, X } from 'lucide-react';
import {
  FAILING_GRADE,
  PASSING_STEPS,
  formatGwa,
  inScope,
  studentSemSummary,
  studentYearSummary,
  type GradeState,
  type HonorsMode,
  type StudentSemester,
  type StudentSubject,
  type StudentYear,
} from '../engine';
import type { Dispatch } from '../lib/state';
import { Button, cx } from './ui';

export function gradeTone(g: GradeState | undefined): string {
  if (g === null || g === undefined) return 'text-slate-300 border-navy-800 bg-navy-950';
  if (g === 'INC' || g === 'IP') return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
  if (g >= FAILING_GRADE) return 'text-rose-300 border-rose-500/40 bg-rose-500/10';
  return 'text-gold-300 border-gold-500/50 bg-gold-500/10';
}

export const GRADE_OPTIONS: Array<{ label: string; shortLabel: string; value: string; state: GradeState }> = [
  { label: 'Not graded yet', shortLabel: 'No grade', value: '', state: null },
  ...PASSING_STEPS.map((n) => ({
    label: n === 1.0 ? '1.00 (Best)' : n === 3.0 ? '3.00 (Pass)' : n.toFixed(2),
    shortLabel: n.toFixed(2),
    value: n.toFixed(2),
    state: n,
  })),
  { label: '5.00 (Failed)', shortLabel: '5.00 (Fail)', value: '5.00', state: 5 },
  { label: 'IP (In Progress)', shortLabel: 'IP (Ongoing)', value: 'IP', state: 'IP' },
  { label: 'INC (Incomplete)', shortLabel: 'INC', value: 'INC', state: 'INC' },
];

const UNIT_OPTIONS = [1, 1.5, 2, 3, 4, 5, 6, 9];

function stateToValue(g: GradeState | undefined): string {
  if (g === null || g === undefined) return '';
  if (typeof g === 'number') return g.toFixed(2);
  return g;
}

const SubjectRow = memo(function SubjectRow({
  sub,
  excluded,
  dispatch,
}: {
  sub: StudentSubject;
  excluded: boolean;
  dispatch: Dispatch;
}) {
  return (
    <div
      className={cx(
        'flex flex-col gap-2 border-b border-navy-800/70 px-3 py-2.5 transition-colors hover:bg-navy-900/40 sm:flex-row sm:items-center sm:px-4',
        excluded && 'opacity-50',
      )}
    >
      {/* Top row on mobile / Left side on desktop: Subject Name + Mobile Delete button */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
        <input
          type="text"
          value={sub.name}
          onChange={(e) =>
            dispatch({ type: 'updateSubject', subId: sub.id, patch: { name: e.target.value } })
          }
          placeholder="Subject name (e.g. IT 111)"
          aria-label="Subject name"
          className="h-9 min-w-0 flex-1 border border-transparent bg-transparent px-1.5 text-xs font-medium text-white placeholder:text-slate-400 hover:border-navy-700 focus:border-gold-400 focus:bg-navy-950 focus:outline-none sm:h-8 sm:px-2 sm:text-sm"
        />
        <button
          type="button"
          onClick={() => dispatch({ type: 'removeSubject', subId: sub.id })}
          title="Remove subject"
          aria-label={`Remove ${sub.name}`}
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-rose-400 sm:hidden"
        >
          <X size={15} />
        </button>
      </div>

      {/* Bottom row on mobile / Right side on desktop: NSTP + Units + Grade + Desktop Delete */}
      <div className="flex items-center gap-2 pl-3.5 sm:pl-0">
        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'updateSubject', subId: sub.id, patch: { isNstp: !sub.isNstp } })
          }
          title="Toggle NSTP (excluded from Latin Honors GWA per RA 9163)"
          className={cx(
            'inline-flex h-9 shrink-0 cursor-pointer items-center border px-2 font-mono text-xs transition-colors sm:h-8 sm:px-1.5 sm:text-[11px]',
            sub.isNstp
              ? 'border-gold-500/50 bg-gold-500/15 text-gold-300'
              : 'border-navy-800 text-slate-400 hover:text-slate-200',
          )}
        >
          NSTP
        </button>

        <select
          aria-label={`${sub.name} units`}
          value={sub.units}
          onChange={(e) =>
            dispatch({
              type: 'updateSubject',
              subId: sub.id,
              patch: { units: Number(e.target.value) },
            })
          }
          className="h-9 shrink-0 border border-navy-800 bg-navy-950 px-2 font-mono text-xs text-slate-200 outline-none focus:border-gold-400 sm:h-8"
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u} className="bg-obsidian">
              {u} {u === 1 ? 'unit' : 'units'}
            </option>
          ))}
        </select>

        <select
          aria-label={`${sub.name} grade`}
          value={stateToValue(sub.grade)}
          onChange={(e) => {
            const opt = GRADE_OPTIONS.find((o) => o.value === e.target.value);
            dispatch({
              type: 'updateSubject',
              subId: sub.id,
              patch: { grade: opt ? opt.state : null },
            });
          }}
          className={cx(
            'h-9 flex-1 cursor-pointer border px-2 font-mono text-xs font-medium outline-none transition-colors focus:border-gold-400 sm:h-8 sm:w-32 sm:flex-none',
            gradeTone(sub.grade),
          )}
        >
          {GRADE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-obsidian text-white">
              {o.shortLabel}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => dispatch({ type: 'removeSubject', subId: sub.id })}
          title="Remove subject"
          aria-label={`Remove ${sub.name}`}
          className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-rose-400 sm:inline-flex"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
});

function AddSubjectForm({
  yearId,
  semId,
  dispatch,
}: {
  yearId: string;
  semId: string;
  dispatch: Dispatch;
}) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState(3);
  const [grade, setGrade] = useState('');

  const addNow = () => {
    const opt = GRADE_OPTIONS.find((o) => o.value === grade);
    const isNstp = /\bnstp\b/i.test(name);
    dispatch({
      type: 'addSubject',
      yearId,
      semId,
      name: name.trim(),
      units,
      grade: opt ? opt.state : null,
      isNstp,
    });
    setName('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addNow();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 bg-obsidian/70 p-3 sm:flex-row sm:items-center sm:p-3.5"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add subject (e.g. IT 111, PurCom, NSTP)…"
        aria-label="New subject name"
        className="h-9 min-w-0 flex-1 border border-navy-800 bg-navy-950/90 px-3 text-xs text-white placeholder:text-slate-400 focus:border-gold-400 focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <select
          aria-label="New subject units"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className="h-9 shrink-0 border border-navy-800 bg-navy-950/90 px-2 font-mono text-xs text-slate-200 outline-none focus:border-gold-400"
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u}>
              {u} {u === 1 ? 'unit' : 'units'}
            </option>
          ))}
        </select>

        <select
          aria-label="New subject grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="h-9 flex-1 border border-navy-800 bg-navy-950/90 px-2 font-mono text-xs text-slate-200 outline-none focus:border-gold-400 sm:w-28 sm:flex-none"
        >
          {GRADE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.shortLabel}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1 border border-gold-400/50 bg-gold-400/15 px-3 text-xs font-semibold text-gold-300 transition-colors hover:bg-gold-400 hover:text-obsidian sm:px-3.5"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>
    </form>
  );
}

function SemesterBlock({
  yearId,
  sem,
  canRemove,
  mode,
  dispatch,
}: {
  yearId: string;
  sem: StudentSemester;
  canRemove: boolean;
  mode: HonorsMode;
  dispatch: Dispatch;
}) {
  const [showDlInfo, setShowDlInfo] = useState(false);
  const summary = studentSemSummary(sem, mode);
  const dl = summary.deansList;

  return (
    <div className="border-t border-navy-800 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-navy-950 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-wide text-slate-200 uppercase">
            {sem.name}
          </span>
          {dl.qualified && (
            <button
              type="button"
              onClick={() => setShowDlInfo((v) => !v)}
              className={cx(
                'inline-flex cursor-pointer items-center gap-1 border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide transition-opacity hover:opacity-90',
                dl.tier === 'First Honors'
                  ? 'border-gold-400/60 bg-gold-400/15 text-gold-300'
                  : 'border-slate-400/50 bg-slate-400/10 text-slate-200',
              )}
              title="Tap to view Dean's List criteria"
            >
              <Award size={11} className="shrink-0 text-gold-400" />
              <span>DL: {dl.tier}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs tabular sm:gap-3">
          <span className="text-slate-400">
            {summary.gradedUnits.toFixed(0)}/{summary.totalUnits.toFixed(0)} units
          </span>
          <span className={summary.gwa === null ? 'text-slate-500' : 'font-semibold text-gold-400'}>
            GWA {formatGwa(summary.gwa, 2)}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'removeSemester', yearId, semId: sem.id })}
              title={`Remove ${sem.name}`}
              aria-label={`Remove ${sem.name}`}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-slate-400 hover:text-rose-400"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {dl.qualified && showDlInfo && (
        <div className="border-b border-navy-800 bg-navy-900/60 px-3.5 py-2 text-xs text-slate-300">
          <strong className="text-gold-300">Dean&apos;s List ({dl.tier}):</strong> Semester GWA ≤{' '}
          {dl.tier === 'First Honors' ? '1.40' : '1.75'}, no subject grade below{' '}
          {dl.tier === 'First Honors' ? '2.00' : '2.25'}, and ≥ 12 graded academic units (based on common USTP criteria).
        </div>
      )}

      {sem.subjects.length > 0 && (
        <div>
          {sem.subjects.map((sub) => (
            <SubjectRow
              key={sub.id}
              sub={sub}
              excluded={!inScope(sub, mode)}
              dispatch={dispatch}
            />
          ))}
        </div>
      )}

      <AddSubjectForm yearId={yearId} semId={sem.id} dispatch={dispatch} />
    </div>
  );
}

export function CurriculumMatrix({
  years,
  mode,
  dispatch,
}: {
  years: StudentYear[];
  mode: HonorsMode;
  dispatch: Dispatch;
}) {
  const [activeYearId, setActiveYearId] = useState<string | 'ALL'>('ALL');
  const validFilter =
    activeYearId === 'ALL' || years.some((y) => y.id === activeYearId) ? activeYearId : 'ALL';

  const visibleYears = validFilter === 'ALL' ? years : years.filter((y) => y.id === validFilter);

  return (
    <div>
      {/* Year Navigation Bar */}
      <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-navy-800 pb-2.5 sm:mb-4 sm:pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {years.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveYearId('ALL')}
              className={cx(
                'h-8 shrink-0 cursor-pointer border px-2.5 text-xs font-medium transition-colors sm:px-3',
                validFilter === 'ALL'
                  ? 'border-gold-400 bg-gold-400 font-semibold text-obsidian'
                  : 'border-navy-800 bg-obsidian-soft text-slate-300 hover:border-navy-600 hover:text-white',
              )}
            >
              All ({years.length})
            </button>
          )}
          {years.map((y) => (
            <button
              key={y.id}
              type="button"
              onClick={() => setActiveYearId(y.id)}
              className={cx(
                'h-8 shrink-0 cursor-pointer border px-2.5 text-xs font-medium transition-colors sm:px-3',
                validFilter === y.id || (years.length === 1 && validFilter === 'ALL')
                  ? 'border-gold-400 bg-gold-400 font-semibold text-obsidian'
                  : 'border-navy-800 bg-obsidian-soft text-slate-300 hover:border-navy-600 hover:text-white',
              )}
            >
              {y.label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => dispatch({ type: 'addYear' })}
          title="Add another Academic Year"
          className="h-8 shrink-0 border-gold-500/40 bg-navy-950 px-2.5 text-gold-400 hover:border-gold-400 hover:text-gold-300 sm:px-3"
        >
          <CalendarPlus size={13} />
          <span className="hidden sm:inline">+ Add Year Level</span>
          <span className="sm:hidden">+ Year</span>
        </Button>
      </div>

      {/* Year Cards */}
      {visibleYears.map((y) => {
        const ySum = studentYearSummary(y, mode);
        return (
          <section key={y.id} className="mb-5 border border-navy-800 bg-obsidian-soft sm:mb-6">
            <header className="flex items-center justify-between gap-2 border-b border-navy-800 border-l-2 border-l-gold-400 bg-navy-900/80 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-white">{y.label}</h3>
                <span className="font-mono text-xs text-slate-400 tabular">
                  <span className="hidden sm:inline">{ySum.gradedUnits.toFixed(0)}/{ySum.totalUnits.toFixed(0)} units · </span>
                  GWA{' '}
                  <span className={ySum.gwa === null ? 'text-slate-500' : 'font-semibold text-gold-400'}>
                    {formatGwa(ySum.gwa, 2)}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'addSemester', yearId: y.id })}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 border border-navy-700 bg-navy-950 px-2 text-[11px] font-medium text-slate-200 hover:border-gold-400/60 hover:text-gold-400 sm:px-2.5"
                >
                  <Plus size={11} className="text-gold-400" /> Term
                </button>
                {years.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'removeYear', yearId: y.id })}
                    title={`Delete ${y.label}`}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 border border-navy-700 bg-navy-950 px-2 text-[11px] text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </header>

            <div>
              {y.semesters.map((sem) => (
                <SemesterBlock
                  key={sem.id}
                  yearId={y.id}
                  sem={sem}
                  canRemove={y.semesters.length > 1}
                  mode={mode}
                  dispatch={dispatch}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

import { memo, useState, type FormEvent } from 'react';
import { CalendarPlus, Plus, Trash2, X } from 'lucide-react';
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
  { label: 'Not graded yet', shortLabel: 'Grade', value: '', state: null },
  ...PASSING_STEPS.map((n) => ({
    label: n === 1.0 ? '1.00 (Best)' : n === 3.0 ? '3.00 (Pass)' : n.toFixed(2),
    shortLabel: n.toFixed(2),
    value: n.toFixed(2),
    state: n,
  })),
  { label: '5.00 (Failed)', shortLabel: '5.00', value: '5.00', state: 5 },
  { label: 'IP (In Progress)', shortLabel: 'IP', value: 'IP', state: 'IP' },
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
        'flex items-center gap-1.5 border-b border-navy-800/70 px-3 py-2 transition-colors hover:bg-navy-900/40 sm:gap-2 sm:px-4 sm:py-2.5',
        excluded && 'opacity-50',
      )}
    >
      <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400 sm:inline-block" />
      <input
        type="text"
        value={sub.name}
        onChange={(e) =>
          dispatch({ type: 'updateSubject', subId: sub.id, patch: { name: e.target.value } })
        }
        placeholder="Subject name"
        aria-label="Subject name"
        className="h-8 min-w-0 flex-1 border border-transparent bg-transparent px-1.5 text-xs font-medium text-white placeholder:text-slate-500 hover:border-navy-700 focus:border-gold-400 focus:bg-navy-950 focus:outline-none sm:px-2 sm:text-sm"
      />

      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'updateSubject', subId: sub.id, patch: { isNstp: !sub.isNstp } })
        }
        title="Toggle NSTP (excluded from Latin Honors GWA per RA 9163)"
        className={cx(
          'shrink-0 cursor-pointer border px-1.5 py-0.5 font-mono text-[10px] transition-colors',
          sub.isNstp
            ? 'border-gold-500/50 bg-gold-500/15 text-gold-300'
            : 'border-navy-800 text-slate-500 hover:text-slate-300',
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
        className="h-8 w-14 shrink-0 border border-navy-800 bg-navy-950 px-1.5 font-mono text-xs text-slate-200 outline-none focus:border-gold-400 sm:w-auto sm:px-2"
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u} className="bg-obsidian">
            {u}u
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
          'h-8 w-20 shrink-0 cursor-pointer border px-1.5 font-mono text-xs font-medium outline-none transition-colors focus:border-gold-400 sm:w-32 sm:px-2',
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
        className="shrink-0 cursor-pointer p-1 text-slate-500 transition-colors hover:text-rose-400"
      >
        <X size={14} />
      </button>
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
      className="flex items-center gap-1.5 bg-obsidian/70 p-2.5 sm:gap-2 sm:p-3.5"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add subject (e.g. IT 111)…"
        aria-label="New subject name"
        className="h-8 min-w-0 flex-1 border border-navy-800 bg-navy-950/90 px-2.5 text-xs text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none sm:h-9 sm:px-3"
      />
      <select
        aria-label="New subject units"
        value={units}
        onChange={(e) => setUnits(Number(e.target.value))}
        className="h-8 w-14 shrink-0 border border-navy-800 bg-navy-950/90 px-1.5 font-mono text-xs text-slate-200 outline-none focus:border-gold-400 sm:h-9 sm:w-auto sm:px-2"
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u}>
            {u}u
          </option>
        ))}
      </select>

      <select
        aria-label="New subject grade"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        className="h-8 w-20 shrink-0 border border-navy-800 bg-navy-950/90 px-1.5 font-mono text-xs text-slate-200 outline-none focus:border-gold-400 sm:h-9 sm:w-28 sm:px-2"
      >
        {GRADE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.shortLabel}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 border border-gold-400/50 bg-gold-400/15 px-2.5 text-xs font-semibold text-gold-300 transition-colors hover:bg-gold-400 hover:text-obsidian sm:h-9 sm:px-3.5"
      >
        <Plus size={13} />
        <span className="hidden sm:inline">Add</span>
      </button>
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
  const summary = studentSemSummary(sem, mode);

  return (
    <div className="border-t border-navy-800 first:border-t-0">
      <div className="flex items-center justify-between gap-2 bg-navy-950 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="font-mono text-xs font-semibold tracking-wide text-slate-200 uppercase">
          {sem.name}
        </span>

        <div className="flex items-center gap-2.5 font-mono text-xs tabular sm:gap-3">
          <span className="text-slate-400">
            {summary.gradedUnits.toFixed(0)}/{summary.totalUnits.toFixed(0)}u
          </span>
          <span className={summary.gwa === null ? 'text-slate-500' : 'font-semibold text-gold-400'}>
            GWA {formatGwa(summary.gwa, 2)}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'removeSemester', yearId, semId: sem.id })}
              title={`Remove ${sem.name}`}
              className="cursor-pointer text-slate-500 hover:text-rose-400"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

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
                  <span className="hidden sm:inline">{ySum.gradedUnits.toFixed(0)}/{ySum.totalUnits.toFixed(0)}u · </span>
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

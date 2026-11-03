import { memo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
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
import { cx } from './ui';

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

function formatGradeChipLabel(g: GradeState | undefined): string {
  if (g === null || g === undefined) return 'Tap to grade';
  if (typeof g === 'number') return g.toFixed(2);
  return g;
}

const SubjectRow = memo(function SubjectRow({
  sub,
  excluded,
  dispatch,
  onMobileEdit,
}: {
  sub: StudentSubject;
  excluded: boolean;
  dispatch: Dispatch;
  onMobileEdit: (sub: StudentSubject) => void;
}) {
  return (
    <div
      className={cx(
        'border-b border-navy-800/70 transition-colors hover:bg-navy-900/40',
        excluded && 'opacity-50',
      )}
    >
      {/* Mobile Card-Based Row (< sm): Tap anywhere to open the Edit Subject Bottom Sheet */}
      <button
        type="button"
        onClick={() => onMobileEdit(sub)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors active:bg-navy-900/80 sm:hidden"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
            <span className="truncate text-sm font-semibold text-white">
              {sub.name || 'Untitled Subject'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 pl-3.5">
            <span className="font-mono text-[11px] text-slate-400">
              {sub.units} {sub.units === 1 ? 'unit' : 'units'}
            </span>
            {sub.isNstp && (
              <span className="rounded-full border border-gold-500/40 bg-gold-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-gold-300">
                NSTP
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cx(
              'inline-flex h-8 min-w-[4.75rem] items-center justify-center rounded-full border px-3 font-mono text-xs font-semibold tabular transition-colors',
              gradeTone(sub.grade),
            )}
          >
            {formatGradeChipLabel(sub.grade)}
          </span>
        </div>
      </button>

      {/* Desktop Inline Row (sm+): Rounded pill chips & selects consistent with mobile */}
      <div className="hidden items-center gap-2 px-4 py-2.5 sm:flex">
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
            className="h-8 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2.5 text-sm font-medium text-white placeholder:text-slate-400 transition-colors hover:border-navy-700 focus:border-gold-400 focus:bg-navy-950 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'updateSubject', subId: sub.id, patch: { isNstp: !sub.isNstp } })
            }
            title="Toggle NSTP (excluded from Latin Honors GWA per RA 9163)"
            className={cx(
              'inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border px-2.5 font-mono text-[11px] font-medium transition-colors',
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
            className="h-8 shrink-0 cursor-pointer rounded-full border border-navy-800 bg-navy-950 px-2.5 font-mono text-xs text-slate-200 transition-colors outline-none hover:border-navy-700 focus:border-gold-400"
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
              'h-8 w-32 flex-none cursor-pointer rounded-full border px-3 font-mono text-xs font-semibold outline-none transition-colors focus:border-gold-400',
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
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <X size={15} />
          </button>
        </div>
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

  /* Desktop Inline Form (sm+) — Mobile uses the circular + FAB instead */
  return (
    <form
      onSubmit={onSubmit}
      className="hidden items-center gap-2 border-t border-navy-800/60 bg-navy-950/35 px-4 py-3 sm:flex"
    >
      <div className="relative flex h-9 min-w-0 flex-1 items-center">
        <Plus size={14} className="pointer-events-none absolute left-3 text-gold-400/80" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add subject (e.g. IT 111, PurCom, NSTP)…"
          aria-label="New subject name"
          className="h-full w-full rounded-full border border-navy-700/80 bg-navy-900/70 pr-3.5 pl-8 text-xs text-white placeholder:text-slate-400 transition-colors focus:border-gold-400 focus:bg-navy-950 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          aria-label="New subject units"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className="h-9 shrink-0 cursor-pointer rounded-full border border-navy-700/80 bg-navy-900/70 px-3 font-mono text-xs text-slate-200 transition-colors outline-none hover:border-navy-600 focus:border-gold-400"
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u} className="bg-obsidian text-white">
              {u} {u === 1 ? 'unit' : 'units'}
            </option>
          ))}
        </select>

        <select
          aria-label="New subject grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="h-9 w-32 flex-none cursor-pointer rounded-full border border-navy-700/80 bg-navy-900/70 px-3 font-mono text-xs text-slate-200 transition-colors outline-none hover:border-navy-600 focus:border-gold-400"
        >
          {GRADE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-obsidian text-white">
              {o.shortLabel}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gold-400 px-4 text-xs font-bold text-obsidian shadow-[0_0_14px_rgba(244,181,42,0.18)] transition-all hover:bg-gold-300 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
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
  searchQuery,
  statusFilter,
  dispatch,
  onMobileEdit,
}: {
  yearId: string;
  sem: StudentSemester;
  canRemove: boolean;
  mode: HonorsMode;
  searchQuery: string;
  statusFilter: 'ALL' | 'GRADED' | 'UNGRADED';
  dispatch: Dispatch;
  onMobileEdit: (sub: StudentSubject) => void;
}) {
  const [showDlInfo, setShowDlInfo] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const summary = studentSemSummary(sem, mode);
  const dl = summary.deansList;

  const q = searchQuery.trim().toLowerCase();
  const filteredSubjects = sem.subjects.filter((sub) => {
    if (q && !sub.name.toLowerCase().includes(q)) return false;
    if (statusFilter === 'GRADED' && typeof sub.grade !== 'number') return false;
    if (statusFilter === 'UNGRADED' && typeof sub.grade === 'number') return false;
    return true;
  });

  if ((q || statusFilter !== 'ALL') && filteredSubjects.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-navy-800 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-navy-950 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-left font-mono text-xs font-semibold tracking-wide text-slate-200 uppercase transition-colors hover:text-gold-300"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronUp size={14} className="text-slate-400" />
            )}
            <span>{sem.name}</span>
          </button>
          {dl.qualified && (
            <button
              type="button"
              onClick={() => setShowDlInfo((v) => !v)}
              className={cx(
                'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide transition-opacity hover:opacity-90',
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
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {dl.qualified && showDlInfo && (
            <div className="animate-pop-in border-b border-navy-800 bg-navy-900/60 px-3.5 py-2 text-xs text-slate-300">
              <strong className="text-gold-300">Dean&apos;s List ({dl.tier}):</strong> Semester GWA ≤{' '}
              {dl.tier === 'First Honors' ? '1.40' : '1.75'}, no subject grade below{' '}
              {dl.tier === 'First Honors' ? '2.00' : '2.25'}, and ≥ 12 graded academic units (based on common USTP criteria).
            </div>
          )}

          {filteredSubjects.length > 0 ? (
            <div>
              {filteredSubjects.map((sub) => (
                <SubjectRow
                  key={sub.id}
                  sub={sub}
                  excluded={!inScope(sub, mode)}
                  dispatch={dispatch}
                  onMobileEdit={onMobileEdit}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-center text-xs text-slate-500 sm:hidden">
              No subjects in this term yet — tap the <strong className="text-gold-400">+</strong> button below to add one.
            </div>
          )}

          <AddSubjectForm yearId={yearId} semId={sem.id} dispatch={dispatch} />
        </>
      )}
    </div>
  );
}

type SheetState =
  | { mode: 'menu' }
  | { mode: 'edit'; subId: string }
  | { mode: 'add'; yearId: string; semId: string }
  | null;

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GRADED' | 'UNGRADED'>('ALL');
  const [sheet, setSheet] = useState<SheetState>(null);

  // Add-subject bottom sheet local state
  const [draftName, setDraftName] = useState('');
  const [draftUnits, setDraftUnits] = useState<number>(3);
  const [draftGrade, setDraftGrade] = useState<GradeState>(null);
  const [draftNstp, setDraftNstp] = useState(false);
  const [draftYearId, setDraftYearId] = useState('');
  const [draftSemId, setDraftSemId] = useState('');

  const validFilter =
    activeYearId === 'ALL' || years.some((y) => y.id === activeYearId) ? activeYearId : 'ALL';

  const visibleYears = validFilter === 'ALL' ? years : years.filter((y) => y.id === validFilter);

  const openMobileAdd = (yearId?: string, semId?: string) => {
    const targetYear =
      years.find((y) => y.id === yearId) ??
      (validFilter !== 'ALL' ? years.find((y) => y.id === validFilter) : undefined) ??
      years[years.length - 1];
    if (!targetYear) return;
    const targetSem =
      targetYear.semesters.find((s) => s.id === semId) ??
      targetYear.semesters[targetYear.semesters.length - 1];
    if (!targetSem) return;

    setDraftYearId(targetYear.id);
    setDraftSemId(targetSem.id);
    setDraftName('');
    setDraftUnits(3);
    setDraftGrade(null);
    setDraftNstp(false);
    setSheet({ mode: 'add', yearId: targetYear.id, semId: targetSem.id });
  };

  const openMobileEdit = (sub: StudentSubject) => {
    setSheet({ mode: 'edit', subId: sub.id });
  };

  // Find live subject when editing in bottom sheet
  const editingSub: StudentSubject | null =
    sheet?.mode === 'edit'
      ? (years
          .flatMap((y) => y.semesters)
          .flatMap((s) => s.subjects)
          .find((s) => s.id === sheet.subId) ?? null)
      : null;

  const submitMobileAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!draftYearId || !draftSemId) return;
    const autoNstp = draftNstp || /\bnstp\b/i.test(draftName);
    dispatch({
      type: 'addSubject',
      yearId: draftYearId,
      semId: draftSemId,
      name: draftName.trim(),
      units: draftUnits,
      grade: draftGrade,
      isNstp: autoNstp,
    });
    setSheet(null);
  };

  return (
    <div>
      {/* Clean Year Tabs Bar (No clutter buttons) */}
      <div className="mb-3.5 space-y-2.5 border-b border-navy-800 pb-2.5 sm:mb-4 sm:pb-3">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-0.5">
          {years.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveYearId('ALL')}
              className={cx(
                'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium transition-all active:scale-95',
                validFilter === 'ALL'
                  ? 'border-gold-400 bg-gold-400 font-semibold text-obsidian shadow-xs'
                  : 'border-navy-800 bg-obsidian-soft text-slate-300 hover:border-navy-600 hover:text-white',
              )}
            >
              {validFilter === 'ALL' && <Check size={12} strokeWidth={2.5} />}
              <span>All ({years.length})</span>
            </button>
          )}
          {years.map((y) => {
            const isSelected =
              validFilter === y.id || (years.length === 1 && validFilter === 'ALL');
            return (
              <button
                key={y.id}
                type="button"
                onClick={() => setActiveYearId(y.id)}
                className={cx(
                  'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium transition-all active:scale-95',
                  isSelected
                    ? 'border-gold-400 bg-gold-400 font-semibold text-obsidian shadow-xs'
                    : 'border-navy-800 bg-obsidian-soft text-slate-300 hover:border-navy-600 hover:text-white',
                )}
              >
                {isSelected && <Check size={12} strokeWidth={2.5} />}
                <span>{y.label}</span>
              </button>
            );
          })}
        </div>

        {/* Expandable Search Input + Status Filter Chips (Opened via the + Menu) */}
        {searchOpen && (
          <div className="animate-pop-in flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject name (e.g. IT 111, Calculus)…"
                aria-label="Search subjects"
                autoFocus
                className="h-9 w-full rounded-full border border-navy-700 bg-navy-950 pr-8 pl-8 text-xs text-white placeholder:text-slate-400 focus:border-gold-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSearchOpen(false);
                }}
                aria-label="Close search"
                title="Close search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: 'All Subjects' },
                  { id: 'GRADED', label: 'Graded' },
                  { id: 'UNGRADED', label: 'Ungraded' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id)}
                  className={cx(
                    'h-7 shrink-0 cursor-pointer rounded-full border px-2.5 text-[11px] font-medium transition-colors',
                    statusFilter === chip.id
                      ? 'border-gold-400/70 bg-gold-400/15 text-gold-300'
                      : 'border-navy-800 bg-navy-950 text-slate-400 hover:text-slate-200',
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Year Cards */}
      {visibleYears.map((y) => {
        const ySum = studentYearSummary(y, mode);
        return (
          <section
            key={y.id}
            className="mb-5 overflow-hidden rounded-2xl border border-navy-800 bg-obsidian-soft shadow-sm sm:mb-6"
          >
            <header className="flex items-center justify-between gap-2 border-b border-navy-800 bg-navy-900/80 px-3.5 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-white">{y.label}</h3>
                <span className="font-mono text-xs text-slate-400 tabular">
                  <span className="hidden sm:inline">
                    {ySum.gradedUnits.toFixed(0)}/{ySum.totalUnits.toFixed(0)} units ·{' '}
                  </span>
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
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-navy-700 bg-navy-950 px-2.5 text-[11px] font-medium text-slate-200 transition-all hover:border-gold-400/60 hover:text-gold-400 active:scale-95"
                >
                  <Plus size={11} className="text-gold-400" /> Term
                </button>
                {years.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'removeYear', yearId: y.id })}
                    title={`Delete ${y.label}`}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-navy-700 bg-navy-950 px-2 text-[11px] text-slate-400 transition-all hover:border-rose-500/50 hover:text-rose-400 active:scale-95"
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
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  dispatch={dispatch}
                  onMobileEdit={openMobileEdit}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Circular Floating Action Button (+): Prompts Add Subject, Add Year, Search */}
      <button
        type="button"
        onClick={() => setSheet({ mode: 'menu' })}
        aria-label="Open actions menu"
        title="Add Subject, Add Year, or Search"
        className="animate-pop-in fixed right-4 bottom-20 z-30 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gold-400 text-obsidian shadow-[0_6px_24px_rgba(244,181,42,0.4)] transition-transform hover:scale-105 active:scale-90 lg:right-8 lg:bottom-8"
      >
        <Plus size={24} strokeWidth={2.75} />
      </button>

      {/* Action Menu Modal Bottom Sheet / Dialog when clicking the + Button */}
      {sheet?.mode === 'menu' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="animate-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs sm:items-center sm:p-4"
            onClick={() => setSheet(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Quick actions"
              onClick={(e) => e.stopPropagation()}
              className="animate-sheet-up w-full max-w-md rounded-t-2xl border-t border-navy-700 bg-obsidian-soft p-5 pb-8 shadow-2xl sm:rounded-2xl sm:border sm:pb-5"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-navy-700 sm:hidden" />

              <div className="mb-3.5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Quick Actions</h3>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  aria-label="Close menu"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-navy-800 bg-navy-950 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => openMobileAdd()}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-navy-800 bg-navy-950 p-3.5 text-left transition-all hover:border-gold-400/50 active:scale-[0.99] active:bg-navy-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Add Subject</div>
                    <div className="text-xs text-slate-400">
                      Add a subject, units, and grade to any year or semester
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'addYear' });
                    setSheet(null);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-navy-800 bg-navy-950 p-3.5 text-left transition-all hover:border-gold-400/50 active:scale-[0.99] active:bg-navy-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400">
                    <CalendarPlus size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Add Year</div>
                    <div className="text-xs text-slate-400">
                      Add another academic year level to your curriculum
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(true);
                    setSheet(null);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-navy-800 bg-navy-950 p-3.5 text-left transition-all hover:border-gold-400/50 active:scale-[0.99] active:bg-navy-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400">
                    <Search size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Search</div>
                    <div className="text-xs text-slate-400">
                      Search subjects by name or filter by graded/ungraded status
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Mobile Modal Bottom Sheet: Edit Subject (Rendered via Portal to document.body) */}
      {editingSub &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="animate-backdrop fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-xs sm:hidden"
            onClick={() => setSheet(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit subject"
              onClick={(e) => e.stopPropagation()}
              className="animate-sheet-up max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border-t border-navy-700 bg-obsidian-soft px-4 pt-3 pb-7 shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-navy-700" />

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  {editingSub.name || 'Subject Details'}
                </h3>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  aria-label="Close sheet"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-navy-800 bg-navy-950 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Subject Name Input */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] text-slate-300 uppercase">
                    Subject Name / Code
                  </label>
                  <input
                    type="text"
                    value={editingSub.name}
                    onChange={(e) =>
                      dispatch({
                        type: 'updateSubject',
                        subId: editingSub.id,
                        patch: { name: e.target.value },
                      })
                    }
                    placeholder="e.g. IT 111, Calculus 1"
                    className="h-10 w-full rounded-xl border border-navy-700 bg-navy-950 px-3 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
                  />
                </div>

                {/* Choice Chips: Grade Picker */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] text-slate-300 uppercase">
                    Final Grade
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GRADE_OPTIONS.map((opt) => {
                      const selected = stateToValue(editingSub.grade) === opt.value;
                      return (
                        <button
                          key={opt.value || 'none'}
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: 'updateSubject',
                              subId: editingSub.id,
                              patch: { grade: opt.state },
                            })
                          }
                          className={cx(
                            'flex h-9 cursor-pointer items-center justify-center rounded-xl border font-mono text-xs font-semibold transition-all active:scale-95',
                            selected
                              ? 'border-gold-400 bg-gold-400 text-obsidian shadow-[0_0_12px_rgba(244,181,42,0.25)]'
                              : 'border-navy-800 bg-navy-950 text-slate-200 hover:border-navy-600',
                          )}
                        >
                          {opt.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Choice Chips: Units */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] text-slate-300 uppercase">
                    Academic Units
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {UNIT_OPTIONS.map((u) => {
                      const selected = editingSub.units === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: 'updateSubject',
                              subId: editingSub.id,
                              patch: { units: u },
                            })
                          }
                          className={cx(
                            'flex h-9 cursor-pointer items-center justify-center rounded-xl border font-mono text-xs font-semibold transition-all active:scale-95',
                            selected
                              ? 'border-gold-400 bg-gold-400/20 text-gold-300'
                              : 'border-navy-800 bg-navy-950 text-slate-300',
                          )}
                        >
                          {u} {u === 1 ? 'unit' : 'units'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Switch Control: NSTP Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950 px-3.5 py-3">
                  <div>
                    <div className="text-xs font-semibold text-white">NSTP / Non-Academic Subject</div>
                    <div className="text-[11px] text-slate-400">
                      Excluded from Latin Honors GWA per RA 9163
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editingSub.isNstp}
                    onClick={() =>
                      dispatch({
                        type: 'updateSubject',
                        subId: editingSub.id,
                        patch: { isNstp: !editingSub.isNstp },
                      })
                    }
                    className={cx(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors',
                      editingSub.isNstp
                        ? 'border-gold-400 bg-gold-400'
                        : 'border-navy-700 bg-navy-900',
                    )}
                  >
                    <span
                      className={cx(
                        'inline-block h-4 w-4 rounded-full transition-transform',
                        editingSub.isNstp
                          ? 'translate-x-5 bg-obsidian'
                          : 'translate-x-1 bg-slate-400',
                      )}
                    />
                  </button>
                </div>

                {/* Bottom Actions: Delete & Done */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'removeSubject', subId: editingSub.id });
                      setSheet(null);
                    }}
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/25 px-3.5 text-xs font-semibold text-rose-300 transition-transform active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-gold-400 text-xs font-bold text-obsidian transition-transform active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal Bottom Sheet / Dialog: Add Subject (No "NEW SUBJECT" header above title) */}
      {sheet?.mode === 'add' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="animate-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs sm:items-center sm:p-4"
            onClick={() => setSheet(null)}
          >
            <form
              role="dialog"
              aria-modal="true"
              aria-label="Add subject"
              onSubmit={submitMobileAdd}
              onClick={(e) => e.stopPropagation()}
              className="animate-sheet-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-navy-700 bg-obsidian-soft px-4 pt-3 pb-7 shadow-2xl sm:rounded-2xl sm:border sm:p-5"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-navy-700 sm:hidden" />

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Add Subject to Curriculum</h3>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  aria-label="Close sheet"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-navy-800 bg-navy-950 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Target Year & Term Picker */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-slate-400 uppercase">
                      Year Level
                    </label>
                    <select
                      value={draftYearId}
                      onChange={(e) => {
                        const nextYear = years.find((y) => y.id === e.target.value);
                        setDraftYearId(e.target.value);
                        if (nextYear && nextYear.semesters[0]) {
                          setDraftSemId(nextYear.semesters[0].id);
                        }
                      }}
                      className="h-9 w-full rounded-xl border border-navy-700 bg-navy-950 px-2.5 text-xs text-white focus:border-gold-400 focus:outline-none"
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id} className="bg-obsidian">
                          {y.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-slate-400 uppercase">
                      Semester / Term
                    </label>
                    <select
                      value={draftSemId}
                      onChange={(e) => setDraftSemId(e.target.value)}
                      className="h-9 w-full rounded-xl border border-navy-700 bg-navy-950 px-2.5 text-xs text-white focus:border-gold-400 focus:outline-none"
                    >
                      {(years.find((y) => y.id === draftYearId)?.semesters ?? []).map((s) => (
                        <option key={s.id} value={s.id} className="bg-obsidian">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject Name */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] text-slate-300 uppercase">
                    Subject Name / Code
                  </label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="e.g. IT 111, PurCom, NSTP 1"
                    autoFocus
                    className="h-10 w-full rounded-xl border border-navy-700 bg-navy-950 px-3 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
                  />
                </div>

                {/* Choice Chips: Units */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] text-slate-300 uppercase">
                    Academic Units
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {UNIT_OPTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setDraftUnits(u)}
                        className={cx(
                          'flex h-9 cursor-pointer items-center justify-center rounded-xl border font-mono text-xs font-semibold transition-all active:scale-95',
                          draftUnits === u
                            ? 'border-gold-400 bg-gold-400/20 text-gold-300'
                            : 'border-navy-800 bg-navy-950 text-slate-300',
                        )}
                      >
                        {u} {u === 1 ? 'unit' : 'units'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Choice Chips: Grade */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] text-slate-300 uppercase">
                    Grade (or leave as No grade for upcoming subjects)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GRADE_OPTIONS.map((opt) => {
                      const selected = stateToValue(draftGrade) === opt.value;
                      return (
                        <button
                          key={opt.value || 'none'}
                          type="button"
                          onClick={() => setDraftGrade(opt.state)}
                          className={cx(
                            'flex h-9 cursor-pointer items-center justify-center rounded-xl border font-mono text-xs font-semibold transition-all active:scale-95',
                            selected
                              ? 'border-gold-400 bg-gold-400 text-obsidian shadow-[0_0_12px_rgba(244,181,42,0.25)]'
                              : 'border-navy-800 bg-navy-950 text-slate-200',
                          )}
                        >
                          {opt.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Switch Control: NSTP */}
                <div className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950 px-3.5 py-3">
                  <div>
                    <div className="text-xs font-semibold text-white">NSTP / Non-Academic Subject</div>
                    <div className="text-[11px] text-slate-400">
                      Excluded from Latin Honors GWA per RA 9163
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draftNstp}
                    onClick={() => setDraftNstp((v) => !v)}
                    className={cx(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors',
                      draftNstp ? 'border-gold-400 bg-gold-400' : 'border-navy-700 bg-navy-900',
                    )}
                  >
                    <span
                      className={cx(
                        'inline-block h-4 w-4 rounded-full transition-transform',
                        draftNstp ? 'translate-x-5 bg-obsidian' : 'translate-x-1 bg-slate-400',
                      )}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-400 text-xs font-bold text-obsidian shadow-[0_0_18px_rgba(244,181,42,0.25)] transition-transform active:scale-95"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add Subject</span>
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </div>
  );
}

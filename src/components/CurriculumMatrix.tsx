import { memo, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Lightbulb,
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
import { Button, ModalDialog, cx, useEscapeKey, useScrollLock } from './ui';

export function gradeTone(g: GradeState | undefined): string {
  if (g === null || g === undefined) return 'text-[var(--neu-ink-muted)]';
  if (g === 'INC' || g === 'IP') return 'text-[var(--neu-warn)]';
  if (g >= FAILING_GRADE) return 'text-[var(--neu-danger)]';
  return 'text-[var(--neu-accent)]';
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
        'border-b border-[var(--neu-border)] transition-colors hover:bg-[var(--neu-surface-alt)]/35',
        excluded && 'opacity-55',
      )}
    >
      {/* Mobile Row (< sm) */}
      <button
        type="button"
        onClick={() => onMobileEdit(sub)}
        aria-label={`Edit ${sub.name || 'Untitled Subject'}, ${sub.units} ${sub.units === 1 ? 'unit' : 'units'}, ${formatGradeChipLabel(sub.grade)}`}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left sm:hidden"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--neu-ink)]">
            {sub.name || 'Untitled Subject'}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-[11px] text-[var(--neu-ink-muted)]">
              {sub.units} {sub.units === 1 ? 'unit' : 'units'}
            </span>
            {sub.isNstp && (
              <span className="neu-recessed rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--neu-accent)]">
                NSTP
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cx(
              'neu-recessed inline-flex h-8 min-w-[4.75rem] items-center justify-center rounded-full px-3 font-mono text-xs font-semibold tabular',
              gradeTone(sub.grade),
            )}
          >
            {formatGradeChipLabel(sub.grade)}
          </span>
          <ChevronRight size={14} className="text-[var(--neu-ink-subtle)]" aria-hidden="true" />
        </div>
      </button>

      {/* Desktop Inline Row (sm+) */}
      <div className="hidden items-center gap-2.5 px-4 py-2.5 sm:flex">
        <div className="flex min-w-0 flex-1 items-center">
          <input
            type="text"
            value={sub.name}
            onChange={(e) =>
              dispatch({ type: 'updateSubject', subId: sub.id, patch: { name: e.target.value } })
            }
            placeholder="Subject name (e.g. IT 111)"
            aria-label="Subject name"
            className="h-9 min-w-0 flex-1 rounded-xl bg-transparent px-2.5 text-sm font-medium text-[var(--neu-ink)] placeholder:text-[var(--neu-ink-subtle)] focus:bg-[var(--neu-bg)] focus:shadow-[var(--neu-recessed)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={sub.isNstp}
            onClick={() =>
              dispatch({ type: 'updateSubject', subId: sub.id, patch: { isNstp: !sub.isNstp } })
            }
            title="Mark as NSTP (excluded from Latin Honors GWA per RA 9163)"
            className={cx(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] font-semibold',
              sub.isNstp ? 'neu-pressed text-[var(--neu-accent)]' : 'neu-btn text-[var(--neu-ink-muted)]',
            )}
          >
            <span
              className={cx(
                'inline-flex h-3.5 w-3.5 items-center justify-center rounded border',
                sub.isNstp
                  ? 'border-[var(--neu-accent)] bg-[var(--neu-accent)] text-[var(--neu-accent-ink)]'
                  : 'border-[var(--neu-border-strong)]',
              )}
              aria-hidden="true"
            >
              {sub.isNstp && <Check size={10} strokeWidth={3} />}
            </span>
            <span>NSTP</span>
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
            className="neu-recessed h-8 shrink-0 rounded-full px-3 font-mono text-xs text-[var(--neu-ink)]"
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
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
              'neu-recessed h-8 w-32 flex-none rounded-full px-3 font-mono text-xs font-semibold',
              gradeTone(sub.grade),
            )}
          >
            {GRADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
                {o.shortLabel}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => dispatch({ type: 'removeSubject', subId: sub.id })}
            title="Remove subject"
            aria-label={`Remove ${sub.name}`}
            className="neu-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--neu-ink-muted)] hover:text-[var(--neu-danger)]"
          >
            <X size={14} aria-hidden="true" />
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

  return (
    <form onSubmit={onSubmit} className="hidden items-center gap-2.5 px-4 py-3.5 sm:flex">
      <div className="relative flex h-10 min-w-0 flex-1 items-center">
        <Plus size={14} className="pointer-events-none absolute left-3.5 text-[var(--neu-accent)]" aria-hidden="true" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add subject (e.g. IT 111, PurCom, NSTP)..."
          aria-label="New subject name"
          className="neu-recessed h-full w-full rounded-full pr-4 pl-9 text-xs text-[var(--neu-ink)] placeholder:text-[var(--neu-ink-subtle)]"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          aria-label="New subject units"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className="neu-recessed h-10 shrink-0 rounded-full px-3 font-mono text-xs text-[var(--neu-ink)]"
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
              {u} {u === 1 ? 'unit' : 'units'}
            </option>
          ))}
        </select>

        <select
          aria-label="New subject grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="neu-recessed h-10 w-32 flex-none rounded-full px-3 font-mono text-xs text-[var(--neu-ink)]"
        >
          {GRADE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
              {o.shortLabel}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="neu-btn-accent inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold"
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
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
    <div className="border-t border-[var(--neu-border)] first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-[var(--neu-surface-alt)]/45 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-1.5 -ml-1.5 py-1 text-left text-xs font-bold text-[var(--neu-ink)] transition-colors hover:text-[var(--neu-accent)]"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronDown size={14} className="text-[var(--neu-ink-muted)]" aria-hidden="true" />
            ) : (
              <ChevronUp size={14} className="text-[var(--neu-ink-muted)]" aria-hidden="true" />
            )}
            <span>{sem.name}</span>
          </button>
          {dl.qualified && (
            <button
              type="button"
              onClick={() => setShowDlInfo((v) => !v)}
              aria-expanded={showDlInfo}
              className="neu-recessed inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--neu-accent)]"
              title="Tap to view Dean's List criteria"
            >
              <Award size={11} className="shrink-0" aria-hidden="true" />
              <span>DL: {dl.tier}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-xs tabular">
          <span className="text-[var(--neu-ink-muted)]">
            {summary.gradedUnits.toFixed(0)}/{summary.totalUnits.toFixed(0)} units
          </span>
          <span className={summary.gwa === null ? 'text-[var(--neu-ink-subtle)]' : 'font-semibold text-[var(--neu-accent)]'}>
            GWA {formatGwa(summary.gwa, 2)}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'removeSemester', yearId, semId: sem.id })}
              title={`Remove ${sem.name}`}
              aria-label={`Remove ${sem.name}`}
              className="neu-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink-muted)] hover:text-[var(--neu-danger)]"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {dl.qualified && showDlInfo && (
            <div className="animate-pop-in border-b border-[var(--neu-border)] bg-[var(--neu-surface-alt)]/30 px-4 py-2.5 text-xs text-[var(--neu-ink-muted)]">
              <strong className="text-[var(--neu-accent)]">Dean&apos;s List ({dl.tier}):</strong> Semester GWA ≤{' '}
              {dl.tier === 'First Honors' ? '1.40' : '1.75'}, no subject grade below{' '}
              {dl.tier === 'First Honors' ? '2.00' : '2.25'}, and ≥ 12 graded academic units (based on common USTP
              criteria).
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
            <div className="px-4 py-4 text-center text-xs text-[var(--neu-ink-muted)] sm:hidden">
              No subjects in this term yet. Tap <strong className="text-[var(--neu-accent)]">+</strong> below to add one.
            </div>
          )}

          <AddSubjectForm yearId={yearId} semId={sem.id} dispatch={dispatch} />
        </>
      )}
    </div>
  );
}

type SheetState =
  | { mode: 'edit'; subId: string }
  | { mode: 'add'; yearId: string; semId: string }
  | null;

export function CurriculumMatrix({
  years,
  mode,
  dispatch,
  isMobileActive = true,
}: {
  years: StudentYear[];
  mode: HonorsMode;
  dispatch: Dispatch;
  isMobileActive?: boolean;
}) {
  const [activeYearId, setActiveYearId] = useState<string | 'ALL'>('ALL');
  const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>({});
  const [tipDismissed, setTipDismissed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GRADED' | 'UNGRADED'>('ALL');
  const [fabOpen, setFabOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);

  useScrollLock(fabOpen);
  useEscapeKey(fabOpen, () => setFabOpen(false));

  useEffect(() => {
    if (!isMobileActive) {
      setFabOpen(false);
    }
  }, [isMobileActive]);

  const [draftName, setDraftName] = useState('');
  const [draftUnits, setDraftUnits] = useState<number>(3);
  const [draftGrade, setDraftGrade] = useState<GradeState>(null);
  const [draftNstp, setDraftNstp] = useState(false);
  const [draftYearId, setDraftYearId] = useState('');
  const [draftSemId, setDraftSemId] = useState('');

  const totalSubjectCount = years.reduce(
    (sum, y) => sum + y.semesters.reduce((sSum, sem) => sSum + sem.subjects.length, 0),
    0,
  );

  const validFilter =
    activeYearId === 'ALL' || years.some((y) => y.id === activeYearId) ? activeYearId : 'ALL';

  const visibleYears = validFilter === 'ALL' ? years : years.filter((y) => y.id === validFilter);

  const toggleYearCollapse = (yearId: string) => {
    setCollapsedYears((prev) => ({ ...prev, [yearId]: !prev[yearId] }));
  };

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
      {/* Empty-curriculum inline guidance (replaces blocking landing modal) */}
      {totalSubjectCount === 0 && !tipDismissed && (
        <div className="neu-recessed mb-5 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-xs leading-relaxed text-[var(--neu-ink-muted)]">
          <div className="flex items-start gap-2.5">
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-[var(--neu-accent)]" aria-hidden="true" />
            <span>
              <strong className="text-[var(--neu-ink)]">Start with your curriculum:</strong> Add completed grades and
              upcoming terms across all years (or use Restore to load a JSON backup) so target grades account for your
              remaining units.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTipDismissed(true)}
            aria-label="Dismiss tip"
            className="neu-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Top Year Tabs Bar + Desktop Actions */}
      <div className="mb-5 space-y-3 border-b border-[var(--neu-border)] pb-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto px-1 py-1.5">
            {years.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveYearId('ALL')}
                aria-pressed={validFilter === 'ALL'}
                className={cx(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold',
                  validFilter === 'ALL' ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
                )}
              >
                {validFilter === 'ALL' && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}
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
                  aria-pressed={isSelected}
                  className={cx(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold',
                    isSelected ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
                  )}
                >
                  {isSelected && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}
                  <span>{y.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => {
                  if (v) {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }
                  return !v;
                });
              }}
              aria-expanded={searchOpen}
              aria-label="Search and filter subjects"
              title="Search and filter subjects"
              className={cx(
                'inline-flex h-9 w-9 items-center justify-center rounded-full',
                searchOpen || searchQuery || statusFilter !== 'ALL'
                  ? 'neu-pressed text-[var(--neu-accent)]'
                  : 'neu-btn text-[var(--neu-ink)]',
              )}
            >
              <Search size={14} aria-hidden="true" />
            </button>

            <Button
              onClick={() => dispatch({ type: 'addYear' })}
              title="Add another Academic Year"
              className="h-9 text-[var(--neu-accent)]"
            >
              <CalendarPlus size={13} aria-hidden="true" />
              <span>Add Year Level</span>
            </Button>
          </div>
        </div>

        {/* Expandable Search Input + Status Filter Chips */}
        {searchOpen && (
          <div className="animate-pop-in flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={13}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--neu-ink-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject name (e.g. IT 111, Calculus)..."
                aria-label="Search subjects"
                autoFocus
                className="neu-recessed h-10 w-full rounded-full pr-10 pl-9 text-base text-[var(--neu-ink)] placeholder:text-[var(--neu-ink-subtle)] sm:text-xs"
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
                className="absolute top-1/2 right-1.5 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--neu-ink-muted)] hover:text-[var(--neu-ink)]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-1 py-1">
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
                  aria-pressed={statusFilter === chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={cx(
                    'h-8 shrink-0 rounded-full px-3 text-[11px] font-semibold',
                    statusFilter === chip.id
                      ? 'neu-pressed text-[var(--neu-accent)]'
                      : 'neu-btn text-[var(--neu-ink-muted)]',
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
        const yearCollapsed = !!collapsedYears[y.id] && !searchQuery && statusFilter === 'ALL';
        return (
          <section key={y.id} className="neu-card mb-6 overflow-hidden rounded-3xl">
            <header className="flex items-center justify-between gap-2 border-b border-[var(--neu-border)] px-4 py-2.5 sm:px-5 sm:py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleYearCollapse(y.id)}
                  aria-expanded={!yearCollapsed}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-1.5 -ml-1.5 py-1 text-left text-sm font-bold text-[var(--neu-ink)] transition-colors hover:text-[var(--neu-accent)]"
                >
                  {yearCollapsed ? (
                    <ChevronDown size={15} className="text-[var(--neu-ink-muted)]" aria-hidden="true" />
                  ) : (
                    <ChevronUp size={15} className="text-[var(--neu-ink-muted)]" aria-hidden="true" />
                  )}
                  <span>{y.label}</span>
                </button>
                <span className="font-mono text-xs text-[var(--neu-ink-muted)] tabular">
                  <span className="hidden sm:inline">
                    {ySum.gradedUnits.toFixed(0)}/{ySum.totalUnits.toFixed(0)} units,{' '}
                  </span>
                  GWA{' '}
                  <span
                    className={
                      ySum.gwa === null ? 'text-[var(--neu-ink-subtle)]' : 'font-semibold text-[var(--neu-accent)]'
                    }
                  >
                    {formatGwa(ySum.gwa, 2)}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'addSemester', yearId: y.id })}
                  className="neu-btn inline-flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-semibold text-[var(--neu-ink)]"
                >
                  <Plus size={11} className="text-[var(--neu-accent)]" aria-hidden="true" /> Term
                </button>
                {years.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'removeYear', yearId: y.id })}
                    title={`Delete ${y.label}`}
                    aria-label={`Delete ${y.label}`}
                    className="neu-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink-muted)] hover:text-[var(--neu-danger)]"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            </header>

            {!yearCollapsed && (
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
            )}
          </section>
        );
      })}

      {/* Mobile Speed Dial FAB (Subjects tab only) */}
      {isMobileActive &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="sm:hidden">
            {fabOpen && (
              <button
                type="button"
                aria-label="Close quick actions menu"
                onClick={() => setFabOpen(false)}
                onTouchMove={(e) => e.preventDefault()}
                className="animate-backdrop fixed inset-0 z-40 w-full cursor-default bg-[var(--neu-backdrop)] backdrop-blur-xs touch-none overscroll-none"
              />
            )}

            <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-3">
              {fabOpen && (
                <div className="mb-1 flex flex-col items-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFabOpen(false);
                      setSearchOpen(true);
                    }}
                    className="animate-speed-dial-3 group flex items-center gap-3"
                  >
                    <span className="neu-card rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--neu-ink)]">
                      Search
                    </span>
                    <span className="neu-btn flex h-11 w-11 items-center justify-center rounded-full text-[var(--neu-accent)]">
                      <Search size={18} aria-hidden="true" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFabOpen(false);
                      dispatch({ type: 'addYear' });
                    }}
                    className="animate-speed-dial-2 group flex items-center gap-3"
                  >
                    <span className="neu-card rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--neu-ink)]">
                      Add Year
                    </span>
                    <span className="neu-btn flex h-11 w-11 items-center justify-center rounded-full text-[var(--neu-accent)]">
                      <CalendarPlus size={18} aria-hidden="true" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFabOpen(false);
                      openMobileAdd();
                    }}
                    className="animate-speed-dial-1 group flex items-center gap-3"
                  >
                    <span className="neu-card rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--neu-ink)]">
                      Add Subject
                    </span>
                    <span className="neu-btn flex h-11 w-11 items-center justify-center rounded-full text-[var(--neu-accent)]">
                      <BookOpen size={18} aria-hidden="true" />
                    </span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setFabOpen((v) => !v)}
                aria-expanded={fabOpen}
                aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
                title="Add Subject, Add Year, or Search"
                className={cx(
                  'neu-btn-accent inline-flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200',
                  fabOpen && 'rotate-45',
                )}
              >
                <Plus size={26} strokeWidth={2.75} aria-hidden="true" />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Mobile Bottom Sheet: Edit Subject */}
      <ModalDialog
        open={!!editingSub}
        onClose={() => setSheet(null)}
        label="Edit subject"
        variant="sheet"
        className="sm:hidden"
      >
        {editingSub && (
          <>
            <div className="neu-recessed mx-auto mb-3 h-1.5 w-10 rounded-full" />

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--neu-ink)]">
                {editingSub.name || 'Subject Details'}
              </h3>
              <button
                type="button"
                onClick={() => setSheet(null)}
                aria-label="Close sheet"
                className="neu-btn inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-sub-name" className="mb-1.5 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                  Subject Name / Code
                </label>
                <input
                  id="edit-sub-name"
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
                  className="neu-recessed h-11 w-full rounded-2xl px-3.5 text-base text-[var(--neu-ink)] placeholder:text-[var(--neu-ink-subtle)]"
                />
              </div>

              <fieldset>
                <legend className="mb-1.5 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                  Final Grade
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {GRADE_OPTIONS.map((opt) => {
                    const selected = stateToValue(editingSub.grade) === opt.value;
                    return (
                      <button
                        key={opt.value || 'none'}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          dispatch({
                            type: 'updateSubject',
                            subId: editingSub.id,
                            patch: { grade: opt.state },
                          })
                        }
                        className={cx(
                          'flex h-11 items-center justify-center rounded-2xl px-1.5 text-center font-mono text-[11px] leading-tight font-semibold',
                          selected ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
                        )}
                      >
                        {opt.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                  Academic Units
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {UNIT_OPTIONS.map((u) => {
                    const selected = editingSub.units === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          dispatch({
                            type: 'updateSubject',
                            subId: editingSub.id,
                            patch: { units: u },
                          })
                        }
                        className={cx(
                          'flex h-11 items-center justify-center rounded-2xl font-mono text-xs font-semibold',
                          selected ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
                        )}
                      >
                        {u} {u === 1 ? 'unit' : 'units'}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="neu-recessed flex items-center justify-between rounded-2xl px-3.5 py-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--neu-ink)]">
                    NSTP / Non-Academic Subject
                  </div>
                  <div className="text-[11px] text-[var(--neu-ink-muted)]">
                    Excluded from Latin Honors GWA per RA 9163
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editingSub.isNstp}
                  aria-label="NSTP or non-academic subject"
                  onClick={() =>
                    dispatch({
                      type: 'updateSubject',
                      subId: editingSub.id,
                      patch: { isNstp: !editingSub.isNstp },
                    })
                  }
                  className={cx(
                    'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors',
                    editingSub.isNstp ? 'bg-[var(--neu-accent)]' : 'neu-recessed',
                  )}
                >
                  <span
                    className={cx(
                      'inline-block h-5 w-5 rounded-full transition-transform',
                      editingSub.isNstp
                        ? 'translate-x-5 bg-[var(--neu-accent-ink)]'
                        : 'neu-btn translate-x-0 bg-[var(--neu-bg)]',
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'removeSubject', subId: editingSub.id });
                    setSheet(null);
                  }}
                  className="neu-btn inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl px-4 text-xs font-semibold text-[var(--neu-danger)]"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setSheet(null)}
                  className="neu-btn-accent inline-flex h-11 flex-1 items-center justify-center rounded-2xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </ModalDialog>

      {/* Modal Bottom Sheet / Dialog: Add Subject */}
      <ModalDialog
        open={sheet?.mode === 'add'}
        onClose={() => setSheet(null)}
        label="Add subject"
        variant="sheet"
        panelClassName="max-w-md"
      >
        <form onSubmit={submitMobileAdd}>
          <div className="neu-recessed mx-auto mb-3 h-1.5 w-10 rounded-full sm:hidden" />

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--neu-ink)]">Add Subject to Curriculum</h3>
            <button
              type="button"
              onClick={() => setSheet(null)}
              aria-label="Close sheet"
              className="neu-btn inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="add-year-select" className="mb-1 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                  Year Level
                </label>
                <select
                  id="add-year-select"
                  value={draftYearId}
                  onChange={(e) => {
                    const nextYear = years.find((y) => y.id === e.target.value);
                    setDraftYearId(e.target.value);
                    if (nextYear && nextYear.semesters[0]) {
                      setDraftSemId(nextYear.semesters[0].id);
                    }
                  }}
                  className="neu-recessed h-11 w-full rounded-2xl px-3 text-base text-[var(--neu-ink)] sm:text-xs"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="add-sem-select" className="mb-1 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                  Semester / Term
                </label>
                <select
                  id="add-sem-select"
                  value={draftSemId}
                  onChange={(e) => setDraftSemId(e.target.value)}
                  className="neu-recessed h-11 w-full rounded-2xl px-3 text-base text-[var(--neu-ink)] sm:text-xs"
                >
                  {(years.find((y) => y.id === draftYearId)?.semesters ?? []).map((s) => (
                    <option key={s.id} value={s.id} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="add-sub-name" className="mb-1.5 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                Subject Name / Code
              </label>
              <input
                id="add-sub-name"
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. IT 111, PurCom, NSTP 1"
                autoFocus
                className="neu-recessed h-11 w-full rounded-2xl px-3.5 text-base text-[var(--neu-ink)] placeholder:text-[var(--neu-ink-subtle)]"
              />
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                Academic Units
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {UNIT_OPTIONS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={draftUnits === u}
                    onClick={() => setDraftUnits(u)}
                    className={cx(
                      'flex h-11 items-center justify-center rounded-2xl font-mono text-xs font-semibold',
                      draftUnits === u ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
                    )}
                  >
                    {u} {u === 1 ? 'unit' : 'units'}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 block text-xs font-semibold text-[var(--neu-ink-muted)]">
                Grade (or leave as No grade for upcoming subjects)
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {GRADE_OPTIONS.map((opt) => {
                  const selected = stateToValue(draftGrade) === opt.value;
                  return (
                    <button
                      key={opt.value || 'none'}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setDraftGrade(opt.state)}
                      className={cx(
                        'flex h-11 items-center justify-center rounded-2xl px-1.5 text-center font-mono text-[11px] leading-tight font-semibold',
                        selected ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
                      )}
                    >
                      {opt.shortLabel}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="neu-recessed flex items-center justify-between rounded-2xl px-3.5 py-3">
              <div>
                <div className="text-xs font-semibold text-[var(--neu-ink)]">
                  NSTP / Non-Academic Subject
                </div>
                <div className="text-[11px] text-[var(--neu-ink-muted)]">
                  Excluded from Latin Honors GWA per RA 9163
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draftNstp}
                aria-label="NSTP or non-academic subject"
                onClick={() => setDraftNstp((v) => !v)}
                className={cx(
                  'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors',
                  draftNstp ? 'bg-[var(--neu-accent)]' : 'neu-recessed',
                )}
              >
                <span
                  className={cx(
                    'inline-block h-5 w-5 rounded-full transition-transform',
                    draftNstp
                      ? 'translate-x-5 bg-[var(--neu-accent-ink)]'
                      : 'neu-btn translate-x-0 bg-[var(--neu-bg)]',
                  )}
                />
              </button>
            </div>

            <button
              type="submit"
              className="neu-btn-accent inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              <span>Add Subject</span>
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}

import { AlertOctagon, Award, CheckCircle2, CircleAlert, SlidersHorizontal } from 'lucide-react';
import { HONOR_TIERS, classifyGwa, formatGwa, solveTarget, type Ledger } from '../engine';
import { Label, cx } from './ui';

export function SummaryStrip({
  ledger,
  mode,
  target,
}: {
  ledger: Ledger;
  mode: 'academic' | 'institutional';
  target: number;
}) {
  const tier = ledger.hardDisqualified ? null : classifyGwa(ledger.gwa);
  const projTier = ledger.hardDisqualified ? null : classifyGwa(ledger.projectedGwa);
  const progress = ledger.totalUnits > 0 ? ledger.completedUnits / ledger.totalUnits : 0;
  const progressPct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const hard = ledger.disqualifiers.filter((d) => d.severity === 'hard');
  const soft = ledger.disqualifiers.filter((d) => d.severity === 'pending');

  const solver = solveTarget(ledger, target);
  const targetTier = HONOR_TIERS.find((t) => Math.abs(t.max - target) < 1e-4);
  const goalName = targetTier ? targetTier.label : `a ${target.toFixed(2)} GWA`;

  const gradedYears = ledger.gradedYearsCount ?? 0;
  const totalYearsEntered = ledger.yearsWithSubjectsCount ?? 0;
  const isGradComplete = !!ledger.isGraduationComplete;

  let headline = 'Add your completed and upcoming subjects below to see your GWA and Latin Honors standing.';
  let headlineTone = 'text-[var(--neu-ink-muted)]';

  if (ledger.hardDisqualified) {
    headline = `A failing grade (5.00) in ${hard.map((d) => d.code).join(', ')} disqualifies Latin Honors eligibility.`;
    headlineTone = 'text-[var(--neu-danger)]';
  } else if (ledger.totalUnits > 0 && ledger.remainingUnits === 0 && ledger.completedUnits > 0) {
    if (!isGradComplete) {
      headline = `Only ${gradedYears} of 4 years graded so far (${tier ? `on ${tier.label} pace` : 'currently > 1.75'}). Latin Honors requires all 4 years: add your remaining years and ungraded subjects below to forecast graduation.`;
      headlineTone = 'text-[var(--neu-warn)]';
    } else {
      headline = tier
        ? `All 4 years are graded. Your final GWA qualifies for ${tier.label}.`
        : 'All 4 years are graded. Final GWA is above the 1.75 Latin Honors cutoff.';
      headlineTone = tier ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]';
    }
  } else if (ledger.completedUnits > 0 && solver.remainingUnits > 0) {
    const partialNote =
      totalYearsEntered < 4
        ? ` (Based on ${totalYearsEntered} of 4 years entered; add remaining years for full graduation accuracy.)`
        : '';
    if (solver.status === 'SECURED') {
      headline = `On track for ${goalName}: even 3.00s in your remaining ${solver.remainingUnits.toFixed(0)} units keep you within the cutoff.`;
      headlineTone = 'text-[var(--neu-accent)]';
    } else if (solver.status === 'FEASIBLE' && solver.requiredAverage !== null) {
      headline = `To reach ${goalName}, maintain an average of ${solver.requiredAverage.toFixed(2)} or better across your ${solver.remainingUnits.toFixed(0)} ungraded units.${partialNote}`;
      headlineTone = 'text-[var(--neu-ink)]';
    } else if (solver.status === 'IMPOSSIBLE' && solver.bestPossibleGwa !== null) {
      headline = `${goalName} (${target.toFixed(2)}) is out of reach on current units: straight 1.00s in your remaining ${solver.remainingUnits.toFixed(0)} units reach ${solver.bestPossibleGwa.toFixed(4)}.${partialNote}`;
      headlineTone = 'text-[var(--neu-warn)]';
    }
  }

  const standingPrefix = ledger.hardDisqualified
    ? 'Not Eligible'
    : ledger.gwa === null
      ? 'Awaiting Grades'
      : !isGradComplete
        ? gradedYears < 4
          ? `Yr ${gradedYears} of 4`
          : 'In Progress'
        : tier
          ? tier.label
          : 'Regular';

  const standingSuffix =
    !ledger.hardDisqualified && ledger.gwa !== null
      ? !isGradComplete
        ? tier
          ? `(${tier.short} Pace)`
          : '(> 1.75)'
        : !tier
          ? '(> 1.75)'
          : null
      : null;

  return (
    <section className="my-5 sm:my-6" aria-label="GWA and honors summary">
      {/* Mobile / Tablet Compact Summary Strip (< lg) */}
      <div className="neu-card rounded-3xl p-4 lg:hidden">
        <div className="grid grid-cols-3 divide-x divide-[var(--neu-border)]">
          <div className="pr-2.5">
            <div className="text-[11px] font-semibold text-[var(--neu-accent)]">
              {mode === 'academic' ? 'Honors GWA' : 'GWA (All)'}
            </div>
            <div
              className={cx(
                'mt-0.5 font-mono text-lg font-bold tracking-tight tabular sm:text-2xl',
                ledger.gwa === null ? 'text-[var(--neu-ink-subtle)]' : 'text-[var(--neu-ink)]',
              )}
            >
              {formatGwa(ledger.gwa, 4)}
            </div>
          </div>

          <div className="px-2.5 sm:px-3">
            <div className="text-[11px] font-semibold text-[var(--neu-accent)]">Standing</div>
            <div
              className={cx(
                'mt-1 text-xs leading-snug font-bold',
                ledger.hardDisqualified
                  ? 'text-[var(--neu-danger)]'
                  : tier
                    ? 'text-[var(--neu-accent)]'
                    : 'text-[var(--neu-ink)]',
              )}
            >
              {standingPrefix}
              {standingSuffix && (
                <>
                  {' '}
                  <span className="whitespace-nowrap">{standingSuffix}</span>
                </>
              )}
            </div>
          </div>

          <div className="pl-2.5 sm:pl-3">
            <div className="text-[11px] font-semibold text-[var(--neu-accent)]">Graded</div>
            <div className="mt-1 font-mono text-xs font-semibold text-[var(--neu-ink)] tabular">
              {ledger.completedUnits.toFixed(0)}/{ledger.totalUnits.toFixed(0)} units
            </div>
          </div>
        </div>

        {ledger.totalUnits > 0 && !ledger.hardDisqualified && (
          <p className={cx('mt-3 border-t border-[var(--neu-border)] pt-2.5 text-xs leading-relaxed', headlineTone)}>
            {headline}
          </p>
        )}

        {ledger.whatIfUnits > 0 && ledger.projectedGwa !== null && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--neu-border)] pt-2.5 font-mono text-[11px] font-semibold text-[var(--neu-accent)]">
            <SlidersHorizontal size={11} className="shrink-0" aria-hidden="true" />
            <span>
              What-If GWA: {formatGwa(ledger.projectedGwa)}
              {projTier ? ` (${projTier.short})` : ''}
            </span>
          </div>
        )}
        {ledger.hardDisqualified && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--neu-border)] pt-2.5 text-[11px] text-[var(--neu-danger)]">
            <AlertOctagon size={12} className="shrink-0" aria-hidden="true" />
            <span>5.00 in {hard.map((d) => d.code).join(', ')} disqualifies Latin Honors.</span>
          </div>
        )}
      </div>

      {/* Desktop 3-Card Summary Strip (lg+) */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-12">
        {/* Card 1: Current GWA */}
        <div className="neu-card rounded-3xl p-5 lg:col-span-4">
          <Label>{mode === 'academic' ? 'Current Honors GWA' : 'Current GWA (All Subjects)'}</Label>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span
              className={cx(
                'font-mono text-5xl font-bold tracking-tight tabular',
                ledger.gwa === null ? 'text-[var(--neu-ink-subtle)]' : 'text-[var(--neu-ink)]',
              )}
            >
              {formatGwa(ledger.gwa)}
            </span>
            {ledger.gwa !== null && (
              <span className="font-mono text-xs font-semibold text-[var(--neu-accent)]">
                ({ledger.gwa.toFixed(2)})
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-[11px] text-[var(--neu-ink-muted)]">
            {ledger.completedUnits > 0
              ? ledger.whatIfUnits > 0
                ? `${ledger.completedUnits.toFixed(0)} graded, ${ledger.whatIfUnits.toFixed(0)} what-if, ${ledger.remainingUnits.toFixed(0)} ungraded`
                : `${ledger.completedUnits.toFixed(0)} graded units, ${ledger.remainingUnits.toFixed(0)} ungraded units`
              : 'No graded subjects yet'}
          </div>
        </div>

        {/* Card 2: Standing */}
        <div className="neu-card rounded-3xl p-5 lg:col-span-3">
          <Label>Honors Standing</Label>
          <div className="mt-2.5 flex items-center gap-2">
            <Award
              size={18}
              aria-hidden="true"
              className={cx(
                'shrink-0',
                ledger.hardDisqualified
                  ? 'text-[var(--neu-danger)]'
                  : tier
                    ? 'text-[var(--neu-accent)]'
                    : 'text-[var(--neu-ink-subtle)]',
              )}
            />
            <span
              className={cx(
                'truncate text-lg font-bold',
                ledger.hardDisqualified
                  ? 'text-[var(--neu-danger)]'
                  : tier
                    ? 'text-[var(--neu-accent)]'
                    : 'text-[var(--neu-ink)]',
              )}
            >
              {standingPrefix}
              {standingSuffix ? ` ${standingSuffix}` : ''}
            </span>
          </div>

          {ledger.whatIfUnits > 0 && ledger.projectedGwa !== null && (
            <div className="neu-recessed mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold text-[var(--neu-accent)]">
              <SlidersHorizontal size={11} aria-hidden="true" />
              <span>
                What-If: {formatGwa(ledger.projectedGwa)}
                {projTier ? ` (${projTier.short})` : ''}
              </span>
            </div>
          )}

          {hard.length === 0 && soft.length === 0 && ledger.gwa !== null && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--neu-ink-muted)]">
              <CheckCircle2 size={12} className="shrink-0 text-[var(--neu-accent)]" aria-hidden="true" />
              <span>
                {isGradComplete
                  ? 'All 4 years completed, no 5.00 or INC'
                  : `Provisional pace (${gradedYears} of 4 yrs graded); full 4-year grades required`}
              </span>
            </div>
          )}
          {hard.length === 0 && soft.length === 0 && ledger.gwa === null && (
            <div className="mt-2.5 text-xs text-[var(--neu-ink-subtle)]">Add grades below to check standing</div>
          )}
          {hard.map((d, i) => (
            <div key={`${d.code}-${i}`} className="mt-2 flex items-center gap-1.5 text-xs text-[var(--neu-danger)]">
              <AlertOctagon size={12} aria-hidden="true" /> {d.code}: {d.reason}
            </div>
          ))}
          {soft.map((d, i) => (
            <div key={`${d.code}-${i}`} className="mt-2 flex items-center gap-1.5 text-xs text-[var(--neu-warn)]">
              <CircleAlert size={12} aria-hidden="true" /> {d.code}: Unresolved INC
            </div>
          ))}
        </div>

        {/* Card 3: Progress & Next-Step Guidance */}
        <div className="neu-card rounded-3xl p-5 lg:col-span-5">
          <div className="flex items-baseline justify-between">
            <Label>Curriculum Progress</Label>
            <span className="font-mono text-xs font-semibold text-[var(--neu-accent)] tabular">
              {ledger.completedUnits.toFixed(0)} / {ledger.totalUnits.toFixed(0)} units ({progressPct}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Curriculum completion"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="neu-recessed mt-3 h-3 w-full overflow-hidden rounded-full p-0.5"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-[var(--neu-accent)] transition-transform duration-300"
              style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }}
            />
          </div>
          <p className={cx('mt-3 text-xs leading-relaxed', headlineTone)}>{headline}</p>
        </div>
      </div>
    </section>
  );
}

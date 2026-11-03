import { AlertOctagon, Award, CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';
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
  const hard = ledger.disqualifiers.filter((d) => d.severity === 'hard');
  const soft = ledger.disqualifiers.filter((d) => d.severity === 'pending');

  const solver = solveTarget(ledger, target);
  const targetTier = HONOR_TIERS.find((t) => Math.abs(t.max - target) < 1e-4);
  const goalName = targetTier ? targetTier.label : `a ${target.toFixed(2)} GWA`;

  const gradedYears = ledger.gradedYearsCount ?? 0;
  const totalYearsEntered = ledger.yearsWithSubjectsCount ?? 0;
  const isGradComplete = !!ledger.isGraduationComplete;

  let headline = 'Add your completed and upcoming subjects below to see your GWA and Latin Honors standing.';
  let headlineTone = 'text-slate-300';

  if (ledger.hardDisqualified) {
    headline = `A failing grade (5.00) in ${hard.map((d) => d.code).join(', ')} disqualifies Latin Honors eligibility.`;
    headlineTone = 'text-rose-300';
  } else if (ledger.totalUnits > 0 && ledger.remainingUnits === 0 && ledger.completedUnits > 0) {
    if (!isGradComplete) {
      headline = `Only ${gradedYears} of 4 years graded so far (${tier ? `on ${tier.label} pace` : 'currently > 1.75'}). Latin Honors requires all 4 years — add your remaining years and ungraded subjects below to forecast graduation.`;
      headlineTone = 'text-amber-300';
    } else {
      headline = tier
        ? `All 4 years are graded — your final GWA qualifies for ${tier.label}!`
        : 'All 4 years are graded — final GWA is above the 1.75 Latin Honors cutoff.';
      headlineTone = tier ? 'text-gold-300' : 'text-slate-300';
    }
  } else if (ledger.completedUnits > 0 && solver.remainingUnits > 0) {
    const partialNote =
      totalYearsEntered < 4
        ? ` (Based on ${totalYearsEntered} of 4 years entered — add remaining years for full graduation accuracy.)`
        : '';
    if (solver.status === 'SECURED') {
      headline = `On track for ${goalName} — even 3.00s in your remaining ${solver.remainingUnits.toFixed(0)} units keep you within the cutoff.`;
      headlineTone = 'text-gold-300';
    } else if (solver.status === 'FEASIBLE' && solver.requiredAverage !== null) {
      headline = `To reach ${goalName}, maintain an average of ${solver.requiredAverage.toFixed(2)} or better across your ${solver.remainingUnits.toFixed(0)} ungraded units.${partialNote}`;
      headlineTone = 'text-white';
    } else if (solver.status === 'IMPOSSIBLE' && solver.bestPossibleGwa !== null) {
      headline = `${goalName} (${target.toFixed(2)}) is out of reach on current units — straight 1.00s in your remaining ${solver.remainingUnits.toFixed(0)} units reach ${solver.bestPossibleGwa.toFixed(4)}.${partialNote}`;
      headlineTone = 'text-amber-300';
    }
  }

  const standingLabel = ledger.hardDisqualified
    ? 'Not Eligible'
    : ledger.gwa === null
      ? 'Awaiting Grades'
      : !isGradComplete
        ? gradedYears < 4
          ? `Yr ${gradedYears} of 4 (${tier ? `${tier.short} Pace` : '> 1.75'})`
          : `In Progress (${tier ? `${tier.short} Pace` : '> 1.75'})`
        : tier
          ? tier.label
          : 'Regular (> 1.75)';

  return (
    <section className="my-3.5 sm:my-5">
      {/* Mobile / Tablet Compact Summary Strip (< lg) */}
      <div className="rounded-2xl border border-navy-800 bg-obsidian-soft p-3.5 shadow-sm lg:hidden">
        <div className="grid grid-cols-3 divide-x divide-navy-800">
          {/* Col 1: GWA */}
          <div className="pr-3">
            <div className="font-mono text-[10px] font-semibold tracking-wider text-gold-400 uppercase">
              {mode === 'academic' ? 'Honors GWA' : 'GWA (All)'}
            </div>
            <div
              className={cx(
                'mt-0.5 font-mono text-2xl font-bold tracking-tight tabular',
                ledger.gwa === null ? 'text-slate-600' : 'text-white',
              )}
            >
              {formatGwa(ledger.gwa, 2)}
            </div>
          </div>

          {/* Col 2: Standing */}
          <div className="px-2.5 sm:px-3">
            <div className="font-mono text-[10px] font-semibold tracking-wider text-gold-400 uppercase">
              Standing
            </div>
            <div
              className={cx(
                'mt-1 text-xs leading-snug font-bold',
                ledger.hardDisqualified
                  ? 'text-rose-400'
                  : tier
                    ? 'text-gold-400'
                    : 'text-slate-200',
              )}
            >
              {standingLabel}
            </div>
          </div>

          {/* Col 3: Units */}
          <div className="pl-2.5 sm:pl-3">
            <div className="font-mono text-[10px] font-semibold tracking-wider text-gold-400 uppercase">
              Graded
            </div>
            <div className="mt-1 font-mono text-xs font-semibold text-slate-200 tabular">
              {ledger.completedUnits.toFixed(0)}/{ledger.totalUnits.toFixed(0)} units
            </div>
          </div>
        </div>

        {/* Main answer / headline on mobile */}
        {ledger.totalUnits > 0 && !ledger.hardDisqualified && (
          <p className={cx('mt-2.5 border-t border-navy-800 pt-2 text-xs leading-relaxed', headlineTone)}>
            {headline}
          </p>
        )}

        {/* Compact What-If / Disqualifier status */}
        {ledger.whatIfUnits > 0 && ledger.projectedGwa !== null && (
          <div className="mt-2 flex items-center gap-1.5 border-t border-navy-800 pt-2 font-mono text-[11px] text-gold-300">
            <Sparkles size={11} className="shrink-0" />
            <span>
              What-If GWA: {formatGwa(ledger.projectedGwa)}
              {projTier ? ` (${projTier.short})` : ''}
            </span>
          </div>
        )}
        {ledger.hardDisqualified && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-navy-800 pt-2 text-[11px] text-rose-400">
            <AlertOctagon size={12} className="shrink-0" />
            <span>5.00 in {hard.map((d) => d.code).join(', ')} disqualifies Latin Honors.</span>
          </div>
        )}
      </div>

      {/* Desktop 3-Card Summary Strip (lg+) */}
      <div className="hidden gap-3.5 lg:grid lg:grid-cols-12">
        {/* Card 1: Current GWA */}
        <div className="rounded-2xl border border-navy-800 bg-obsidian-soft p-5 shadow-sm lg:col-span-4">
          <Label>{mode === 'academic' ? 'Current Honors GWA' : 'Current GWA (All Subjects)'}</Label>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span
              className={cx(
                'font-mono text-5xl font-bold tracking-tight tabular',
                ledger.gwa === null ? 'text-slate-600' : 'text-white',
              )}
            >
              {formatGwa(ledger.gwa)}
            </span>
            {ledger.gwa !== null && (
              <span className="font-mono text-xs text-gold-400">({ledger.gwa.toFixed(2)})</span>
            )}
          </div>
          <div className="mt-2 font-mono text-[11px] text-slate-400">
            {ledger.completedUnits > 0
              ? `${ledger.completedUnits.toFixed(0)} graded units · ${ledger.remainingUnits.toFixed(0)} ungraded units`
              : 'No graded subjects yet'}
          </div>
        </div>

        {/* Card 2: Standing */}
        <div className="rounded-2xl border border-navy-800 bg-obsidian-soft p-5 shadow-sm lg:col-span-3">
          <Label>Honors Standing</Label>
          <div className="mt-2.5 flex items-center gap-2">
            <Award
              size={18}
              className={cx(
                'shrink-0',
                ledger.hardDisqualified
                  ? 'text-rose-400'
                  : tier
                    ? 'text-gold-400'
                    : 'text-slate-500',
              )}
            />
            <span
              className={cx(
                'truncate text-lg font-bold',
                ledger.hardDisqualified
                  ? 'text-rose-400'
                  : tier
                    ? 'text-gold-400'
                    : 'text-slate-200',
              )}
            >
              {standingLabel}
            </span>
          </div>

          {ledger.whatIfUnits > 0 && ledger.projectedGwa !== null && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 font-mono text-[11px] text-gold-300">
              <Sparkles size={11} />
              What-If: {formatGwa(ledger.projectedGwa)}
              {projTier ? ` (${projTier.short})` : ''}
            </div>
          )}

          {hard.length === 0 && soft.length === 0 && ledger.gwa !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 size={12} className="shrink-0 text-gold-400" />
              <span>
                {isGradComplete
                  ? 'All 4 years completed — no 5.00 or INC'
                  : `Provisional pace (${gradedYears} of 4 yrs graded) — full 4-year grades required`}
              </span>
            </div>
          )}
          {hard.length === 0 && soft.length === 0 && ledger.gwa === null && (
            <div className="mt-2 text-xs text-slate-500">Add grades below to check standing</div>
          )}
          {hard.map((d, i) => (
            <div key={`${d.code}-${i}`} className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
              <AlertOctagon size={12} /> {d.code}: {d.reason}
            </div>
          ))}
          {soft.map((d, i) => (
            <div key={`${d.code}-${i}`} className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
              <CircleAlert size={12} /> {d.code}: Unresolved INC
            </div>
          ))}
        </div>

        {/* Card 3: Progress & Next-Step Guidance */}
        <div className="rounded-2xl border border-navy-800 bg-obsidian-soft p-5 shadow-sm lg:col-span-5">
          <div className="flex items-baseline justify-between">
            <Label>Curriculum Progress</Label>
            <span className="font-mono text-xs text-gold-400 tabular">
              {ledger.completedUnits.toFixed(0)} / {ledger.totalUnits.toFixed(0)} units ({(progress * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-navy-900">
            <div
              className="h-full rounded-full bg-gold-400 transition-[width] duration-300"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
          <p className={cx('mt-3 text-xs leading-relaxed', headlineTone)}>{headline}</p>
        </div>
      </div>
    </section>
  );
}

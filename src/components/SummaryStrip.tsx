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

  let headline = 'Add your completed and upcoming subjects below to see your GWA and Latin Honors standing.';
  let headlineTone = 'text-slate-300';

  if (ledger.hardDisqualified) {
    headline = `A failing grade (5.00) in ${hard.map((d) => d.code).join(', ')} disqualifies Latin Honors eligibility.`;
    headlineTone = 'text-rose-300';
  } else if (ledger.totalUnits > 0 && ledger.remainingUnits === 0 && ledger.completedUnits > 0) {
    headline = tier
      ? `All added subjects are graded — your GWA qualifies for ${tier.label}!`
      : 'Add your upcoming ungraded subjects too to calculate the exact grades you need for Latin Honors.';
    headlineTone = tier ? 'text-gold-300' : 'text-slate-300';
  } else if (ledger.completedUnits > 0 && solver.remainingUnits > 0) {
    if (solver.status === 'SECURED') {
      headline = `On track for ${goalName} — even 3.00s in your remaining ${solver.remainingUnits.toFixed(0)} units keep you within the cutoff.`;
      headlineTone = 'text-gold-300';
    } else if (solver.status === 'FEASIBLE' && solver.requiredAverage !== null) {
      headline = `To graduate as ${goalName}, maintain an average of ${solver.requiredAverage.toFixed(2)} or better across your remaining ${solver.remainingUnits.toFixed(0)} ungraded units.`;
      headlineTone = 'text-white';
    } else if (solver.status === 'IMPOSSIBLE' && solver.bestPossibleGwa !== null) {
      headline = `${goalName} (${target.toFixed(2)}) is out of reach — straight 1.00s in your remaining ${solver.remainingUnits.toFixed(0)} units reach ${solver.bestPossibleGwa.toFixed(4)}.`;
      headlineTone = 'text-amber-300';
    }
  }

  return (
    <section className="my-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
      {/* Card 1: Current GWA */}
      <div className="border border-navy-800 border-l-2 border-l-gold-400 bg-obsidian-soft p-4 sm:p-5 lg:col-span-4">
        <Label>{mode === 'academic' ? 'Current Honors GWA' : 'Current GWA (All Subjects)'}</Label>
        <div className="mt-2 flex items-baseline gap-2.5">
          <span
            className={cx(
              'font-mono text-4xl font-bold tracking-tight tabular sm:text-5xl',
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
      <div className="border border-navy-800 border-l-2 border-l-gold-400 bg-obsidian-soft p-4 sm:p-5 lg:col-span-3">
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
              'truncate text-base font-bold sm:text-lg',
              ledger.hardDisqualified
                ? 'text-rose-400'
                : tier
                  ? 'text-gold-400'
                  : 'text-slate-200',
            )}
          >
            {ledger.hardDisqualified
              ? 'Not Eligible'
              : tier
                ? tier.label
                : ledger.gwa === null
                  ? 'Awaiting Grades'
                  : 'Regular (> 1.75)'}
          </span>
        </div>

        {ledger.whatIfUnits > 0 && ledger.projectedGwa !== null && (
          <div className="mt-2 inline-flex items-center gap-1.5 border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 font-mono text-[11px] text-gold-300">
            <Sparkles size={11} />
            What-If: {formatGwa(ledger.projectedGwa)}
            {projTier ? ` (${projTier.short})` : ''}
          </div>
        )}

        {hard.length === 0 && soft.length === 0 && ledger.gwa !== null && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 size={12} className="text-gold-400" /> Eligible — no 5.00 or INC
          </div>
        )}
        {hard.length === 0 && soft.length === 0 && ledger.gwa === null && (
          <div className="mt-2 text-xs text-slate-400">Summa ≤ 1.25 · Magna ≤ 1.50 · Cum ≤ 1.75</div>
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
      <div className="border border-navy-800 border-l-2 border-l-gold-400 bg-obsidian-soft p-4 sm:col-span-2 sm:p-5 lg:col-span-5">
        <div className="flex items-baseline justify-between">
          <Label>Curriculum Progress</Label>
          <span className="font-mono text-xs text-gold-400 tabular">
            {ledger.completedUnits.toFixed(0)} / {ledger.totalUnits.toFixed(0)} units ({(progress * 100).toFixed(0)}%)
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden bg-navy-900">
          <div
            className="h-full bg-gold-400 transition-[width] duration-200"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <p className={cx('mt-3 text-xs leading-relaxed', headlineTone)}>{headline}</p>
      </div>
    </section>
  );
}

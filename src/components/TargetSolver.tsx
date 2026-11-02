import { CheckCircle2, XCircle } from 'lucide-react';
import { HONOR_TIERS, formatGwa, solveTarget, type Ledger, type SolverResult } from '../engine';
import { Panel, cx } from './ui';

function describeStatus(
  r: SolverResult,
  label: string,
  totalUnits: number,
  maxCutoff: number,
): { badge: string; detail: string; tone: string; reachable: boolean } {
  if (totalUnits === 0) {
    return {
      badge: `≤ ${maxCutoff.toFixed(2)}`,
      detail: 'Add completed & upcoming subjects on the left to calculate your required average.',
      tone: 'text-gold-400 border-navy-700 bg-navy-950',
      reachable: true,
    };
  }
  switch (r.status) {
    case 'SECURED':
    case 'ACHIEVED':
      return {
        badge: 'Secured',
        detail:
          r.remainingUnits > 0
            ? `Any passing grade (up to 3.00) keeps you in ${label}.`
            : `Your completed GWA qualifies for ${label}.`,
        tone: 'text-gold-300 border-gold-500/50 bg-gold-500/15',
        reachable: true,
      };
    case 'FEASIBLE':
      return {
        badge: `Avg ≤ ${formatGwa(r.requiredAverage, 2)}`,
        detail: `Need at least a ${formatGwa(r.requiredAverage, 2)} average (≈ straight ${r.requiredStep?.toFixed(2)}s) across ${r.remainingUnits.toFixed(0)} ungraded units.`,
        tone: 'text-white border-navy-700 bg-navy-900',
        reachable: true,
      };
    case 'IMPOSSIBLE':
      return {
        badge: 'Out of reach',
        detail: `Even straight 1.00s in your remaining ${r.remainingUnits.toFixed(0)} units finish at ${formatGwa(r.bestPossibleGwa, 4)} (short by ${r.deficit?.toFixed(4)}).`,
        tone: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
        reachable: false,
      };
    case 'MISSED':
      return {
        badge: 'Above cutoff',
        detail: 'Add upcoming ungraded subjects to see what grades you need to pull your GWA up.',
        tone: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
        reachable: false,
      };
    case 'DISQUALIFIED':
      return {
        badge: 'Disqualified',
        detail: 'A failing grade (5.00) on record disqualifies Latin Honors.',
        tone: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
        reachable: false,
      };
  }
}

export function TargetSolver({
  ledger,
  target,
  onTarget,
}: {
  ledger: Ledger;
  target: number;
  onTarget: (t: number) => void;
}) {
  const activeResult = solveTarget(ledger, target);

  return (
    <Panel
      step="1"
      title="Target Honor Goal"
      subtitle="Select a Latin Honor tier to see the average grade required across your remaining subjects."
      meta={`${ledger.remainingUnits.toFixed(0)}u ungraded`}
    >
      <div className="space-y-2">
        {HONOR_TIERS.map((t) => {
          const r = solveTarget(ledger, t.max);
          const info = describeStatus(r, t.label, ledger.totalUnits, t.max);
          const selected = Math.abs(target - t.max) < 1e-4;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTarget(t.max)}
              className={cx(
                'block w-full cursor-pointer border border-l-2 p-3 text-left transition-colors',
                selected
                  ? 'border-navy-700 border-l-gold-400 bg-navy-900/90'
                  : 'border-navy-800 border-l-transparent bg-navy-950/60 hover:border-navy-700',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {info.reachable ? (
                    <CheckCircle2 size={14} className="shrink-0 text-gold-400" />
                  ) : (
                    <XCircle size={14} className="shrink-0 text-rose-400" />
                  )}
                  <span className="truncate text-xs font-bold text-white sm:text-sm">{t.label}</span>
                </div>
                <span className={cx('shrink-0 border px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap', info.tone)}>
                  {info.badge}
                </span>
              </div>
              <p className="mt-1.5 pl-5 text-xs leading-relaxed text-slate-400">{info.detail}</p>
            </button>
          );
        })}
      </div>

      {/* Best vs Worst case summary */}
      {ledger.totalUnits > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-navy-800 pt-3.5">
          <div className="border border-navy-800 bg-navy-950/80 p-2.5">
            <div className="text-[11px] text-slate-400">Best reachable GWA</div>
            <div className="mt-0.5 font-mono text-base font-bold text-gold-400 tabular">
              {formatGwa(activeResult.bestPossibleGwa)}
            </div>
            <div className="text-[10px] text-slate-500">with straight 1.00s left</div>
          </div>
          <div className="border border-navy-800 bg-navy-950/80 p-2.5">
            <div className="text-[11px] text-slate-400">Safest passing GWA</div>
            <div className="mt-0.5 font-mono text-base font-bold text-white tabular">
              {formatGwa(activeResult.worstPassingGwa)}
            </div>
            <div className="text-[10px] text-slate-500">with straight 3.00s left</div>
          </div>
        </div>
      )}
    </Panel>
  );
}

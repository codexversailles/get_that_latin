import { CheckCircle2, XCircle } from 'lucide-react';
import { HONOR_TIERS, formatGwa, solveTarget, type Ledger, type SolverResult } from '../engine';
import { Panel, cx } from './ui';

function describeStatus(
  r: SolverResult,
  label: string,
  ledger: Ledger,
  maxCutoff: number,
): { badge: string; detail: string; tone: string; reachable: boolean } {
  const { totalUnits, gradedYearsCount = 0, yearsWithSubjectsCount = 0 } = ledger;
  if (totalUnits === 0) {
    return {
      badge: `≤ ${maxCutoff.toFixed(2)}`,
      detail: 'Add completed and upcoming subjects on the left to calculate your required average.',
      tone: 'text-[var(--neu-accent)]',
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
            ? `Any passing grade (up to 3.00) across your remaining ${r.remainingUnits.toFixed(0)} units keeps you in ${label}.`
            : `All 4 years are graded and your final GWA qualifies for ${label}.`,
        tone: 'text-[var(--neu-accent)]',
        reachable: true,
      };
    case 'INCOMPLETE_CURRICULUM':
      return {
        badge: `Yr ${gradedYearsCount} of 4 only`,
        detail: `Only ${gradedYearsCount} of 4 years graded so far. Add your remaining years and ungraded subjects to calculate the average needed for ${label}.`,
        tone: 'text-[var(--neu-warn)]',
        reachable: true,
      };
    case 'FEASIBLE': {
      const partialNote =
        yearsWithSubjectsCount > 0 && yearsWithSubjectsCount < 4
          ? ` (Only ${yearsWithSubjectsCount} of 4 years added so far; add remaining years for full graduation accuracy.)`
          : '';
      return {
        badge: `Avg ≤ ${formatGwa(r.requiredAverage, 2)}`,
        detail: `Need at least a ${formatGwa(r.requiredAverage, 2)} average (≈ straight ${r.requiredStep?.toFixed(2)}s) across ${r.remainingUnits.toFixed(0)} ungraded units.${partialNote}`,
        tone: 'text-[var(--neu-ink)]',
        reachable: true,
      };
    }
    case 'IMPOSSIBLE':
      return {
        badge: 'Out of reach',
        detail: `Even straight 1.00s in your remaining ${r.remainingUnits.toFixed(0)} units finish at ${formatGwa(r.bestPossibleGwa, 4)} (short by ${r.deficit?.toFixed(4)}).`,
        tone: 'text-[var(--neu-danger)]',
        reachable: false,
      };
    case 'MISSED':
      return {
        badge: 'Above cutoff',
        detail: 'Final GWA across all 4 years is above this cutoff.',
        tone: 'text-[var(--neu-warn)]',
        reachable: false,
      };
    case 'DISQUALIFIED':
      return {
        badge: 'Disqualified',
        detail: 'A failing grade (5.00) on record disqualifies Latin Honors.',
        tone: 'text-[var(--neu-danger)]',
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
      meta={`${ledger.remainingUnits.toFixed(0)} units ungraded`}
    >
      <div className="space-y-3">
        {HONOR_TIERS.map((t) => {
          const r = solveTarget(ledger, t.max);
          const info = describeStatus(r, t.label, ledger, t.max);
          const selected = Math.abs(target - t.max) < 1e-4;

          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onTarget(t.max)}
              className={cx(
                'block w-full rounded-2xl p-3.5 text-left transition-[box-shadow,transform,color] duration-150',
                selected ? 'neu-pressed translate-y-[1px]' : 'neu-btn',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {info.reachable ? (
                    <CheckCircle2 size={15} className="shrink-0 text-[var(--neu-accent)]" aria-hidden="true" />
                  ) : (
                    <XCircle size={15} className="shrink-0 text-[var(--neu-danger)]" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <div
                      className={cx(
                        'truncate text-xs font-bold sm:text-sm',
                        selected ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink)]',
                      )}
                    >
                      {t.label}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--neu-ink-subtle)]">
                      GWA ≤ {t.max.toFixed(2)}
                    </div>
                  </div>
                </div>
                <span
                  className={cx(
                    'neu-recessed shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold whitespace-nowrap',
                    info.tone,
                  )}
                >
                  {info.badge}
                </span>
              </div>
              {selected && (
                <p className="mt-2 pl-6 text-xs leading-relaxed text-[var(--neu-ink-muted)]">{info.detail}</p>
              )}
            </button>
          );
        })}
      </div>

      {ledger.totalUnits > 0 && activeResult.bestPossibleGwa !== null && (
        <div className="mt-4 grid grid-cols-2 divide-x divide-[var(--neu-border)] border-t border-[var(--neu-border)] pt-4">
          <div className="pr-3">
            <div className="text-[11px] text-[var(--neu-ink-muted)]">Best reachable GWA</div>
            <div className="mt-0.5 font-mono text-base font-bold text-[var(--neu-accent)] tabular">
              {formatGwa(activeResult.bestPossibleGwa)}
            </div>
            <div className="text-[11px] text-[var(--neu-ink-subtle)]">with straight 1.00s left</div>
          </div>
          <div className="pl-3">
            <div className="text-[11px] text-[var(--neu-ink-muted)]">Safest passing GWA</div>
            <div className="mt-0.5 font-mono text-base font-bold text-[var(--neu-ink)] tabular">
              {formatGwa(activeResult.worstPassingGwa)}
            </div>
            <div className="text-[11px] text-[var(--neu-ink-subtle)]">with straight 3.00s left</div>
          </div>
        </div>
      )}
    </Panel>
  );
}

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { HONOR_TIERS, formatGwa, type Moments, type SimResult } from '../engine';
import type { SimSettings } from '../lib/storage';
import { DensityChart } from './DensityChart';
import { Panel, cx, pct } from './ui';

const PRESETS: Array<{ label: string; desc: string; shift: number }> = [
  { label: 'Improve', desc: 'Better grades ahead', shift: -0.15 },
  { label: 'Consistent', desc: 'Match past grades', shift: 0 },
  { label: 'Tougher', desc: 'Harder terms ahead', shift: 0.15 },
];

export function ProbabilityPanel({
  result,
  busy,
  moments,
  sim,
  onSim,
  marker,
  hardDisqualified,
  pendingInc,
  yearsEntered = 0,
}: {
  result: SimResult | null;
  busy: boolean;
  viaWorker?: boolean;
  moments: Moments;
  sim: SimSettings;
  onSim: (p: Partial<SimSettings>) => void;
  marker: number | null;
  hardDisqualified: boolean;
  pendingInc: number;
  yearsEntered?: number;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const missingYears = yearsEntered > 0 && yearsEntered < 4 ? 4 - yearsEntered : 0;

  const probs: Array<[string, string, number]> = result
    ? [
        [HONOR_TIERS[0].label, '1.00–1.25', result.pSumma],
        [HONOR_TIERS[1].label, '1.25–1.50', result.pMagna],
        [HONOR_TIERS[2].label, '1.50–1.75', result.pCum],
      ]
    : [];

  return (
    <Panel
      step="3"
      title="Honors Probability"
      subtitle={`Simulated across ${sim.runs.toLocaleString()} possible graduation futures.`}
      meta={
        <span className="inline-flex items-center gap-1">
          {busy ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Sparkles size={11} aria-hidden="true" />}
          <span>{busy ? 'Updating' : 'Live'}</span>
        </span>
      }
    >
      {hardDisqualified && (
        <div className="neu-recessed mb-3.5 rounded-2xl p-3 text-xs text-[var(--neu-danger)]">
          A failing grade (5.00) is on record. Latin Honors eligibility is zero.
        </div>
      )}

      {!hardDisqualified && missingYears > 0 && (
        <div className="neu-recessed mb-3.5 rounded-2xl p-3 text-[11px] leading-relaxed text-[var(--neu-warn)]">
          <strong>Yr {yearsEntered} of 4 entered:</strong> Automatically simulating your remaining{' '}
          <strong>
            {missingYears} unentered year{missingYears > 1 ? 's' : ''} ({missingYears * 36} units)
          </strong>{' '}
          to 4th Year so partial grades are never assumed as guaranteed Latin Honors.
        </div>
      )}

      {result && (
        <div className="neu-recessed mb-4 flex items-center justify-between rounded-2xl p-3.5">
          <div>
            <div className="text-xs font-semibold text-[var(--neu-ink)]">Overall Honors Chance</div>
            <div className="mt-0.5 text-[11px] text-[var(--neu-ink-muted)]">
              Projected GWA:{' '}
              <span className="font-mono font-semibold text-[var(--neu-accent)]">{formatGwa(result.p50, 2)}</span>
            </div>
          </div>
          <span
            className={cx(
              'font-mono text-2xl font-bold tabular',
              result.pAny > 0.5 ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink)]',
            )}
          >
            {pct(result.pAny)}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {probs.map(([label, range, p]) => (
          <div key={label}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-[var(--neu-ink)]">
                {label} <span className="font-mono text-[11px] text-[var(--neu-ink-subtle)]">({range})</span>
              </span>
              <span className="font-mono text-xs font-semibold text-[var(--neu-accent)] tabular">{pct(p)}</span>
            </div>
            <div className="neu-recessed mt-1.5 h-2.5 w-full overflow-hidden rounded-full p-0.5">
              <div
                className="h-full w-full origin-left rounded-full bg-[var(--neu-accent)] transition-transform duration-200"
                style={{ transform: `scaleX(${Math.min(1, Math.max(0, p))})` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Future Outlook Presets */}
      <div className="mt-5 border-t border-[var(--neu-border)] pt-4">
        <div className="mb-2.5 text-[11px] font-semibold text-[var(--neu-ink-muted)]">
          Expected pace in upcoming semesters:
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {PRESETS.map((pr) => {
            const active = Math.abs(sim.shift - pr.shift) < 0.03;
            return (
              <button
                key={pr.label}
                type="button"
                aria-pressed={active}
                onClick={() => onSim({ shift: pr.shift })}
                className={cx(
                  'rounded-2xl p-2.5 text-left transition-[box-shadow,transform,color] duration-150',
                  active ? 'neu-pressed translate-y-[1px]' : 'neu-btn',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cx(
                      'text-xs font-bold',
                      active ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink)]',
                    )}
                  >
                    {pr.label}
                  </span>
                  <span
                    className={cx(
                      'h-1.5 w-1.5 rounded-full',
                      active
                        ? 'bg-[var(--neu-accent)] shadow-[0_0_5px_var(--neu-accent)]'
                        : 'bg-[var(--neu-ink-subtle)] opacity-35',
                    )}
                  />
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--neu-ink-muted)]">{pr.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3.5 text-[11px] leading-relaxed text-[var(--neu-ink-subtle)]">
        Statistical estimate based on your grade history, not an official registrar evaluation.
      </p>

      {pendingInc > 0 && (
        <p className="mt-2 text-[11px] text-[var(--neu-warn)]">
          Note: Assumes {pendingInc} incomplete (INC) subject{pendingInc > 1 ? 's are' : ' is'} completed with a
          passing grade.
        </p>
      )}

      {/* Collapsible Advanced Chart & Math Controls */}
      <div className="mt-4 border-t border-[var(--neu-border)] pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--neu-ink-muted)] hover:text-[var(--neu-accent)]"
        >
          <span>{showAdvanced ? 'Hide distribution chart and details' : 'Show distribution chart and details'}</span>
          {showAdvanced ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>

        {showAdvanced && (
          <div className="mt-3.5 space-y-4">
            <div>
              <DensityChart result={result} marker={marker} />
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[var(--neu-ink-muted)] tabular">
                <span>
                  Best 5%: {formatGwa(result?.p05, 2)} | Median: {formatGwa(result?.p50, 2)} | Worst 5%:{' '}
                  {formatGwa(result?.p95, 2)}
                </span>
                {marker !== null && <span className="font-semibold text-[var(--neu-accent)]">Current</span>}
              </div>
            </div>

            <div className="neu-recessed grid grid-cols-3 gap-2 rounded-2xl p-3 font-mono text-[11px] tabular">
              <div>
                <div className="font-sans text-[10px] text-[var(--neu-ink-muted)]">Your avg</div>
                <div className="font-semibold text-[var(--neu-ink)]">{moments.mean.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-[var(--neu-ink-muted)]">Spread</div>
                <div className="font-semibold text-[var(--neu-ink)]">±{moments.std.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-[var(--neu-ink-muted)]">Graded</div>
                <div className="font-semibold text-[var(--neu-ink)]">{moments.n}</div>
              </div>
            </div>

            <label className="block">
              <div className="flex justify-between text-xs text-[var(--neu-ink)]">
                <span>Grade consistency (volatility)</span>
                <span className="font-mono font-semibold text-[var(--neu-accent)]">{sim.volatility.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                className="range mt-1"
                min={0.25}
                max={2.5}
                step={0.05}
                value={sim.volatility}
                onChange={(e) => onSim({ volatility: Number(e.target.value) })}
              />
            </label>
          </div>
        )}
      </div>
    </Panel>
  );
}

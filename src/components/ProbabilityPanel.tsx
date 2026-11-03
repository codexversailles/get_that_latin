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
          {busy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          <span>{busy ? 'Updating' : 'Live'}</span>
        </span>
      }
    >
      {hardDisqualified && (
        <div className="mb-3 rounded-xl border-l-4 border-rose-500 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          A failing grade (5.00) is on record — Latin Honors eligibility is zero.
        </div>
      )}

      {!hardDisqualified && missingYears > 0 && (
        <div className="mb-3 rounded-xl border-l-4 border-amber-400 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
          <strong>Yr {yearsEntered} of 4 entered:</strong> Automatically simulating your remaining{' '}
          <strong>
            {missingYears} unentered year{missingYears > 1 ? 's' : ''} ({missingYears * 36} units)
          </strong>{' '}
          to 4th Year so partial grades are never assumed as guaranteed Latin Honors.
        </div>
      )}

      {result && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-navy-800 border-l-4 border-l-gold-400 bg-navy-950/90 p-3">
          <div>
            <div className="text-xs font-semibold text-white">Overall Honors Chance</div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Projected GWA: <span className="font-mono text-gold-400">{formatGwa(result.p50, 2)}</span>
            </div>
          </div>
          <span
            className={cx(
              'font-mono text-2xl font-bold tabular',
              result.pAny > 0.5 ? 'text-gold-400' : 'text-white',
            )}
          >
            {pct(result.pAny)}
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {probs.map(([label, range, p]) => (
          <div key={label}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-200">
                {label} <span className="font-mono text-[11px] text-slate-500">({range})</span>
              </span>
              <span className="font-mono text-xs font-semibold text-gold-400 tabular">{pct(p)}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-900">
              <div
                className="h-full rounded-full bg-gold-400 transition-[width] duration-200"
                style={{ width: `${Math.min(100, p * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Simple Future Outlook Presets */}
      <div className="mt-4 border-t border-navy-800 pt-3.5">
        <div className="mb-2 text-[11px] font-medium text-slate-300">Expected pace in upcoming semesters:</div>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((pr) => {
            const active = Math.abs(sim.shift - pr.shift) < 0.03;
            return (
              <button
                key={pr.label}
                type="button"
                onClick={() => onSim({ shift: pr.shift })}
                className={cx(
                  'cursor-pointer rounded-xl border p-2 text-left transition-all active:scale-95',
                  active
                    ? 'border-gold-400 bg-gold-400 text-obsidian shadow-xs'
                    : 'border-navy-800 bg-navy-950/70 text-slate-200 hover:border-navy-700',
                )}
              >
                <div className="text-xs font-bold">{pr.label}</div>
                <div className={cx('mt-0.5 text-[10px]', active ? 'text-obsidian/80' : 'text-slate-400')}>
                  {pr.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Statistical estimate based on your grade history — not an official registrar evaluation.
      </p>

      {pendingInc > 0 && (
        <p className="mt-2 text-[11px] text-amber-300/90">
          Note: Assumes {pendingInc} incomplete (INC) subject{pendingInc > 1 ? 's are' : ' is'} completed with a passing grade.
        </p>
      )}

      {/* Collapsible Advanced Chart & Math Controls */}
      <div className="mt-4 border-t border-navy-800 pt-2.5">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between text-left text-xs text-slate-400 hover:text-gold-400"
        >
          <span>{showAdvanced ? 'Hide distribution chart & details' : 'Show distribution chart & details'}</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4">
            <div>
              <DensityChart result={result} marker={marker} />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400 tabular">
                <span>
                  Best 5%: {formatGwa(result?.p05, 2)} · Median: {formatGwa(result?.p50, 2)} · Worst 5%: {formatGwa(result?.p95, 2)}
                </span>
                {marker !== null && <span className="text-gold-400">■ current</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-navy-800 bg-navy-950 p-2.5 font-mono text-[11px] tabular">
              <div>
                <div className="font-sans text-[10px] text-slate-400">Your avg</div>
                <div className="text-white">{moments.mean.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-slate-400">Spread</div>
                <div className="text-white">±{moments.std.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-slate-400">Graded</div>
                <div className="text-white">{moments.n}</div>
              </div>
            </div>

            <label className="block">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Grade consistency (Volatility)</span>
                <span className="font-mono text-gold-400">{sim.volatility.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                className="range"
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

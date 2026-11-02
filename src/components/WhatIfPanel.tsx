import { Plus, RotateCcw, X } from 'lucide-react';
import {
  PASSING_STEPS,
  flattenSubjects,
  inScope,
  isNumericGrade,
  snapToStep,
  type HonorsMode,
  type StudentYear,
} from '../engine';
import type { Dispatch } from '../lib/state';
import { Button, Panel, cx } from './ui';

export function WhatIfPanel({
  years,
  mode,
  defaultGrade,
  dispatch,
}: {
  years: StudentYear[];
  mode: HonorsMode;
  defaultGrade: number;
  dispatch: Dispatch;
}) {
  const all = flattenSubjects(years);
  const ungraded = all.filter((item) => !isNumericGrade(item.subject.grade));
  const active = ungraded.filter((item) => typeof item.subject.whatIf === 'number');
  const addable = ungraded.filter((item) => typeof item.subject.whatIf !== 'number');

  if (ungraded.length === 0) {
    return (
      <Panel
        step="2"
        title="What-If Grade Tester"
        subtitle="Add upcoming subjects with 'Not graded yet' to test how hypothetical grades affect your GWA."
      >
        <div className="border border-navy-800 bg-navy-950/60 px-3.5 py-2.5 text-xs text-slate-400">
          No ungraded subjects yet. Add an upcoming subject on the left to test grades here.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      step="2"
      title="What-If Grade Tester"
      subtitle="Pick an ungraded subject to test how a specific grade changes your GWA."
      meta={
        active.length > 0 ? (
          <Button onClick={() => dispatch({ type: 'clearAllWhatIf' })} className="h-7 px-2 text-[11px]">
            <RotateCcw size={11} /> Reset ({active.length})
          </Button>
        ) : undefined
      }
    >
      {active.length > 0 && (
        <ul className="mb-3 divide-y divide-navy-800">
          {active.map(({ subject: sub, yearLabel, semName }) => {
            const value = sub.whatIf ?? snapToStep(defaultGrade);
            const excluded = !inScope(sub, mode);

            return (
              <li key={sub.id} className={cx('py-3 first:pt-0', excluded && 'opacity-45')}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-white" title={sub.name}>
                      {sub.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {yearLabel} · {semName} ({sub.units} {sub.units === 1 ? 'unit' : 'units'})
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <select
                      aria-label={`${sub.name} what-if grade`}
                      value={value.toFixed(2)}
                      onChange={(e) =>
                        dispatch({
                          type: 'updateSubject',
                          subId: sub.id,
                          patch: { whatIf: Number(e.target.value) },
                        })
                      }
                      className="h-8 border border-gold-500/50 bg-gold-500/15 px-2 font-mono text-xs text-gold-300 outline-none"
                    >
                      {PASSING_STEPS.map((n) => (
                        <option key={n} value={n.toFixed(2)} className="bg-obsidian text-white">
                          {n.toFixed(2)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'updateSubject',
                          subId: sub.id,
                          patch: { whatIf: null },
                        })
                      }
                      className="cursor-pointer p-1 text-slate-400 hover:text-white"
                      title="Remove from What-If"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <span className="font-mono text-[10px] text-gold-400">1.00</span>
                  <input
                    type="range"
                    className="range flex-1"
                    min={1}
                    max={3}
                    step={0.25}
                    value={value}
                    onChange={(e) =>
                      dispatch({
                        type: 'updateSubject',
                        subId: sub.id,
                        patch: { whatIf: Number(e.target.value) },
                      })
                    }
                    aria-label={`${sub.name} scenario slider`}
                  />
                  <span className="font-mono text-[10px] text-slate-400">3.00</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {addable.length > 0 && (
        <div className="flex min-w-0 items-center gap-2">
          <Plus size={14} className="shrink-0 text-gold-400" />
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              dispatch({
                type: 'updateSubject',
                subId: e.target.value,
                patch: { whatIf: snapToStep(defaultGrade) },
              });
            }}
            className="h-9 w-full min-w-0 truncate border border-navy-800 bg-navy-950 px-2.5 text-xs text-slate-200 outline-none focus:border-gold-400"
            aria-label="Select an ungraded subject to test"
          >
            <option value="">Select an ungraded subject to test…</option>
            {addable.map(({ subject: sub, yearLabel }) => (
              <option key={sub.id} value={sub.id} className="bg-obsidian text-white">
                {sub.name} ({sub.units} {sub.units === 1 ? 'unit' : 'units'} · {yearLabel})
              </option>
            ))}
          </select>
        </div>
      )}
    </Panel>
  );
}

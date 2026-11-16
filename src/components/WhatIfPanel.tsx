import { Minus, Plus, RotateCcw, X } from 'lucide-react';
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
        <p className="text-xs leading-relaxed text-[var(--neu-ink-muted)]">
          No ungraded subjects yet. Add an upcoming subject to test hypothetical grades here.
        </p>
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
          <Button onClick={() => dispatch({ type: 'clearAllWhatIf' })} className="h-8 px-3 text-[11px]">
            <RotateCcw size={11} aria-hidden="true" /> Reset ({active.length})
          </Button>
        ) : undefined
      }
    >
      {active.length > 0 && (
        <ul className="mb-4 divide-y divide-[var(--neu-border)]">
          {active.map(({ subject: sub, yearLabel, semName }) => {
            const value = sub.whatIf ?? snapToStep(defaultGrade);
            const excluded = !inScope(sub, mode);

            return (
              <li key={sub.id} className={cx('py-3.5 first:pt-0', excluded && 'opacity-45')}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-[var(--neu-ink)]" title={sub.name}>
                      {sub.name}
                    </div>
                    <div className="text-[11px] text-[var(--neu-ink-muted)]">
                      {yearLabel}, {semName} ({sub.units} {sub.units === 1 ? 'unit' : 'units'})
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      disabled={value <= 1.0}
                      onClick={() =>
                        dispatch({
                          type: 'updateSubject',
                          subId: sub.id,
                          patch: { whatIf: Math.max(1.0, snapToStep(value - 0.25)) },
                        })
                      }
                      aria-label={`Improve ${sub.name} grade by 0.25`}
                      title="Better grade (-0.25)"
                      className="neu-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink)] disabled:opacity-35"
                    >
                      <Minus size={12} aria-hidden="true" />
                    </button>

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
                      className="neu-recessed h-8 rounded-full px-2.5 font-mono text-xs font-semibold text-[var(--neu-accent)]"
                    >
                      {PASSING_STEPS.map((n) => (
                        <option key={n} value={n.toFixed(2)} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
                          {n.toFixed(2)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={value >= 3.0}
                      onClick={() =>
                        dispatch({
                          type: 'updateSubject',
                          subId: sub.id,
                          patch: { whatIf: Math.min(3.0, snapToStep(value + 0.25)) },
                        })
                      }
                      aria-label={`Lower ${sub.name} grade by 0.25`}
                      title="Lower grade (+0.25)"
                      className="neu-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink)] disabled:opacity-35"
                    >
                      <Plus size={12} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'updateSubject',
                          subId: sub.id,
                          patch: { whatIf: null },
                        })
                      }
                      aria-label={`Remove ${sub.name} from What-If`}
                      className="neu-btn ml-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink-muted)] hover:text-[var(--neu-danger)]"
                      title="Remove from What-If"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold text-[var(--neu-accent)]">1.00</span>
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
                  <span className="font-mono text-[11px] text-[var(--neu-ink-muted)]">3.00</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {addable.length > 0 && (
        <div className="flex min-w-0 items-center gap-2.5">
          <Plus size={14} className="shrink-0 text-[var(--neu-accent)]" aria-hidden="true" />
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
            className="neu-recessed h-10 w-full min-w-0 truncate rounded-2xl px-3.5 text-base text-[var(--neu-ink)] sm:text-xs"
            aria-label="Select an ungraded subject to test"
          >
            <option value="">Select an ungraded subject to test...</option>
            {addable.map(({ subject: sub, yearLabel }) => (
              <option key={sub.id} value={sub.id} className="bg-[var(--neu-bg)] text-[var(--neu-ink)]">
                {sub.name} ({sub.units} {sub.units === 1 ? 'unit' : 'units'}, {yearLabel})
              </option>
            ))}
          </select>
        </div>
      )}
    </Panel>
  );
}

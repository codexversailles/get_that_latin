import { useCallback, useMemo, useState } from 'react';
import { BookOpen, RotateCcw, Sparkles, Target, X } from 'lucide-react';
import {
  buildStudentLedger,
  historicalMoments,
  snapToStep,
  yearsToProspectusAndRecord,
  type SimInput,
} from './engine';
import { useAppState } from './lib/state';
import { useMonteCarlo } from './lib/useMonteCarlo';
import { buildExport, downloadJson, readImport } from './lib/transfer';
import type { SimSettings } from './lib/storage';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { SummaryStrip } from './components/SummaryStrip';
import { CurriculumMatrix } from './components/CurriculumMatrix';
import { TargetSolver } from './components/TargetSolver';
import { ProbabilityPanel } from './components/ProbabilityPanel';
import { WhatIfPanel } from './components/WhatIfPanel';
import { cx } from './components/ui';

const SIM_SEED = 0x9e3779b9;

export default function App() {
  const { state, dispatch, clearAll, toast, undo, dismissToast, notify } = useAppState();
  const [entered, setEntered] = useState(false);
  const [mobileTab, setMobileTab] = useState<'grades' | 'goal' | 'probability'>('grades');
  const { honorsMode: mode, target, sim } = state.settings;

  const { prospectus, record } = useMemo(
    () => yearsToProspectusAndRecord(state.years),
    [state.years],
  );
  const ledger = useMemo(
    () => buildStudentLedger(state.years, mode),
    [state.years, mode],
  );
  const moments = useMemo(
    () => historicalMoments(prospectus, record, ledger),
    [prospectus, record, ledger],
  );

  const simInput = useMemo<SimInput | null>(() => {
    const explicitRemaining = ledger.pending.map((x) => ({ units: x.course.units, mean: x.midterm }));
    const yearsEntered = ledger.yearsWithSubjectsCount ?? 0;
    const missingYears = yearsEntered > 0 && yearsEntered < 4 ? 4 - yearsEntered : 0;
    // Each missing academic year in a 4-year USTP degree is modeled as 12 × 3-unit courses (36 units/yr)
    // so 1st-year, sophomore, and 3rd-year students are never assumed 100% locked into their current GWA.
    const estimatedFutureCourses = Array.from({ length: missingYears * 12 }, () => ({ units: 3 }));

    return {
      fixedPoints: ledger.fixedPoints,
      fixedUnits: ledger.fixedUnits,
      remaining: [...explicitRemaining, ...estimatedFutureCourses],
      mean: moments.mean,
      std: moments.std,
      shift: sim.shift,
      volatility: sim.volatility,
      rho: sim.rho,
      runs: sim.runs,
      seed: SIM_SEED,
      hardDisqualified: ledger.hardDisqualified,
    };
  }, [ledger, moments, sim]);

  const mc = useMonteCarlo(simInput);

  const onExport = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(buildExport(state), `getthatlatin-grades-${stamp}.json`);
  }, [state]);

  const onImport = useCallback(
    async (f: File) => {
      try {
        dispatch({ type: 'replace', state: await readImport(f) });
      } catch (e) {
        notify((e as Error).message, 'error');
      }
    },
    [dispatch, notify],
  );

  const onClear = useCallback(() => {
    clearAll();
  }, [clearAll]);

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  return (
    <div className="min-h-screen bg-obsidian pb-20 text-slate-100 lg:pb-12">
      <Header
        onHome={() => setEntered(false)}
        onExport={onExport}
        onImport={onImport}
        onClear={onClear}
      />

      <main className="mx-auto max-w-[1360px] px-3.5 sm:px-6 md:px-8">
        <SummaryStrip ledger={ledger} mode={mode} target={target} />

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Left Column: Student-built Years, Semesters & Subjects */}
          <section
            className={cx('min-w-0 lg:col-span-7 xl:col-span-8', mobileTab !== 'grades' && 'hidden lg:block')}
            aria-label="Your Subjects and Grades"
          >
            <CurriculumMatrix years={state.years} mode={mode} dispatch={dispatch} />
          </section>

          {/* Right Column: Goal, What-If, and Forecast */}
          <aside
            className={cx(
              'min-w-0 space-y-4 sm:space-y-5 lg:col-span-5 xl:col-span-4',
              mobileTab === 'grades' && 'hidden lg:block',
            )}
          >
            <div className="space-y-4 sm:space-y-5">
              <div className={cx('space-y-4 sm:space-y-5', mobileTab !== 'goal' && 'hidden lg:block')}>
                <TargetSolver
                  ledger={ledger}
                  target={target}
                  onTarget={(t) => dispatch({ type: 'setTarget', target: t })}
                />
                <WhatIfPanel
                  years={state.years}
                  mode={mode}
                  defaultGrade={snapToStep(moments.mean + sim.shift)}
                  dispatch={dispatch}
                />
              </div>

              <div className={cx(mobileTab !== 'probability' && 'hidden lg:block')}>
                <ProbabilityPanel
                  result={mc.result}
                  busy={mc.busy}
                  viaWorker={mc.viaWorker}
                  moments={moments}
                  sim={sim}
                  onSim={(patch: Partial<SimSettings>) => dispatch({ type: 'setSim', patch })}
                  marker={ledger.whatIfUnits > 0 ? ledger.projectedGwa : ledger.gwa}
                  hardDisqualified={ledger.hardDisqualified}
                  pendingInc={ledger.disqualifiers.filter((d) => d.severity === 'pending').length}
                  yearsEntered={ledger.yearsWithSubjectsCount ?? 0}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom-Center Snackbar (Undo / Action Notification) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-pop-in fixed right-3 bottom-20 left-3 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-navy-700 border-l-4 border-l-gold-400 bg-navy-950/95 px-4 py-3 text-xs text-slate-100 shadow-2xl backdrop-blur sm:right-6 sm:left-auto sm:w-96 lg:bottom-6"
        >
          <span className={cx('truncate font-medium', toast.tone === 'error' ? 'text-rose-300' : 'text-slate-100')}>
            {toast.message}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {toast.canUndo && (
              <button
                type="button"
                onClick={undo}
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full bg-gold-400 px-3 text-xs font-bold text-obsidian hover:bg-gold-300"
              >
                <RotateCcw size={12} /> Undo
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="cursor-pointer p-1 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-navy-800 bg-navy-950/95 backdrop-blur lg:hidden"
      >
        <div className="grid h-16 grid-cols-3">
          <button
            type="button"
            onClick={() => setMobileTab('grades')}
            className={cx(
              'flex cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              mobileTab === 'grades' ? 'text-gold-300' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <span
              className={cx(
                'inline-flex h-6 w-12 items-center justify-center rounded-full transition-colors',
                mobileTab === 'grades' ? 'bg-gold-400/20 text-gold-300' : 'text-slate-400',
              )}
            >
              <BookOpen size={15} className="shrink-0" />
            </span>
            <span>Subjects</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('goal')}
            className={cx(
              'flex cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              mobileTab === 'goal' ? 'text-gold-300' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <span
              className={cx(
                'inline-flex h-6 w-12 items-center justify-center rounded-full transition-colors',
                mobileTab === 'goal' ? 'bg-gold-400/20 text-gold-300' : 'text-slate-400',
              )}
            >
              <Target size={15} className="shrink-0" />
            </span>
            <span>Goal &amp; Test</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('probability')}
            className={cx(
              'flex cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              mobileTab === 'probability' ? 'text-gold-300' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <span
              className={cx(
                'inline-flex h-6 w-12 items-center justify-center rounded-full transition-colors',
                mobileTab === 'probability' ? 'bg-gold-400/20 text-gold-300' : 'text-slate-400',
              )}
            >
              <Sparkles size={15} className="shrink-0" />
            </span>
            <span>Probability</span>
          </button>
        </div>
      </nav>

      <footer className="mt-12 border-t border-navy-800 sm:mt-16">
        <div className="mx-auto flex max-w-[1360px] items-center justify-center px-4 py-5 text-center text-xs text-slate-400 sm:justify-start sm:px-6 md:px-8">
          <span>100% Private — Your subjects and grades are saved only in your browser.</span>
        </div>
      </footer>
    </div>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import {
  buildStudentLedger,
  formatGwa,
  historicalMoments,
  snapToStep,
  yearsToProspectusAndRecord,
  type HonorsMode,
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
import { cx, pct } from './components/ui';

const SIM_SEED = 0x9e3779b9;

export default function App() {
  const { state, dispatch, clearAll } = useAppState();
  const [entered, setEntered] = useState(false);
  const [mobileTab, setMobileTab] = useState<'grades' | 'forecast'>('grades');
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
    return {
      fixedPoints: ledger.fixedPoints,
      fixedUnits: ledger.fixedUnits,
      remaining: ledger.pending.map((x) => ({ units: x.course.units, mean: x.midterm })),
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
        alert((e as Error).message);
      }
    },
    [dispatch],
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
        mode={mode}
        onMode={(m: HonorsMode) => dispatch({ type: 'setHonorsMode', mode: m })}
        onHome={() => setEntered(false)}
        onExport={onExport}
        onImport={onImport}
        onClear={onClear}
      />

      <main className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8">
        <SummaryStrip ledger={ledger} mode={mode} target={target} />

        <div className="grid gap-6 lg:grid-cols-12">
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
              'min-w-0 space-y-5 lg:col-span-5 xl:col-span-4',
              mobileTab !== 'forecast' && 'hidden lg:block',
            )}
          >
            <div className="space-y-5 lg:sticky lg:top-4">
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
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-navy-800 bg-navy-950/95 backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setMobileTab('grades')}
            className={cx(
              'flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-semibold whitespace-nowrap transition-colors',
              mobileTab === 'grades'
                ? 'border-t-2 border-gold-400 bg-navy-900/80 text-gold-300'
                : 'text-slate-400',
            )}
          >
            <BookOpen size={14} className="shrink-0" />
            <span>Subjects</span>
            <span className="font-mono text-[11px] text-slate-400">
              ({ledger.completedUnits.toFixed(0)}/{ledger.totalUnits.toFixed(0)}u)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('forecast')}
            className={cx(
              'flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-semibold whitespace-nowrap transition-colors',
              mobileTab === 'forecast'
                ? 'border-t-2 border-gold-400 bg-navy-900/80 text-gold-300'
                : 'text-slate-400',
            )}
          >
            <Sparkles size={14} className="shrink-0" />
            <span>Honors Forecast</span>
            <span className="font-mono text-[11px] text-gold-400">
              {ledger.gwa !== null ? formatGwa(ledger.gwa, 2) : mc.result ? pct(mc.result.pAny) : ''}
            </span>
          </button>
        </div>
      </nav>

      <footer className="mt-16 border-t border-navy-800">
        <div className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:px-6 md:px-8">
          <span>100% Private — Your subjects and grades are saved only in your browser.</span>
          <span className="font-mono text-[11px] text-gold-400/90">
            Summa ≤ 1.25 · Magna ≤ 1.50 · Cum Laude ≤ 1.75 (NSTP excluded per RA 9163)
          </span>
        </div>
      </footer>
    </div>
  );
}

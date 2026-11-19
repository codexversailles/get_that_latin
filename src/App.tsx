import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, RotateCcw, Target, TrendingUp, X } from 'lucide-react';
import {
  buildLedger,
  historicalMoments,
  snapToStep,
  yearsToProspectusAndRecord,
  type SimInput,
} from './engine';
import { useAppState } from './lib/state';
import { useMonteCarlo } from './lib/useMonteCarlo';
import { buildExport, downloadJson, readImport } from './lib/transfer';
import { hasSavedRecords, type SimSettings } from './lib/storage';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { SummaryStrip } from './components/SummaryStrip';
import { CurriculumMatrix } from './components/CurriculumMatrix';
import { TargetSolver } from './components/TargetSolver';
import { ProbabilityPanel } from './components/ProbabilityPanel';
import { WhatIfPanel } from './components/WhatIfPanel';
import { cx } from './components/ui';

const SIM_SEED = 0x9e3779b9;
const THEME_KEY = 'gtl-theme';

type MobileTab = 'grades' | 'goal' | 'probability';

function parseHashRoute(): { entered: boolean; tab: MobileTab } | null {
  if (typeof window === 'undefined') return null;
  const h = window.location.hash;
  if (!h) return null;
  if (h === '#/' || h === '#') return { entered: false, tab: 'grades' };
  if (h === '#/app/goal') return { entered: true, tab: 'goal' };
  if (h === '#/app/probability') return { entered: true, tab: 'probability' };
  if (h.startsWith('#/app')) return { entered: true, tab: 'grades' };
  return null;
}

function hashForRoute(entered: boolean, tab: MobileTab): string {
  if (!entered) return '#/';
  if (tab === 'goal') return '#/app/goal';
  if (tab === 'probability') return '#/app/probability';
  return '#/app';
}

function useTheme(): ['dark' | 'light', () => void] {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // ignore storage access issues
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#21242b' : '#e0e5ec');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggle];
}

export default function App() {
  const { state, dispatch, clearAll, toast, undo, dismissToast, notify } = useAppState();
  const [theme, toggleTheme] = useTheme();
  const [route, setRoute] = useState<{ entered: boolean; tab: MobileTab }>(() => {
    const parsed = parseHashRoute();
    if (parsed) return parsed;
    if (hasSavedRecords(state)) {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '#/app');
      }
      return { entered: true, tab: 'grades' };
    }
    return { entered: false, tab: 'grades' };
  });

  useEffect(() => {
    const onHash = () => {
      const parsed = parseHashRoute();
      if (parsed) {
        setRoute(parsed);
      } else {
        setRoute({ entered: false, tab: 'grades' });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((entered: boolean, tab: MobileTab = 'grades') => {
    const targetHash = hashForRoute(entered, tab);
    if (typeof window !== 'undefined' && window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute({ entered, tab });
  }, []);

  const { entered, tab: mobileTab } = route;
  const { honorsMode: mode, target, sim } = state.settings;

  const { prospectus, record } = useMemo(
    () => yearsToProspectusAndRecord(state.years),
    [state.years],
  );
  const ledger = useMemo(
    () => buildLedger(prospectus, record, mode),
    [prospectus, record, mode],
  );
  const moments = useMemo(
    () => historicalMoments(prospectus, record, ledger),
    [prospectus, record, ledger],
  );

  const simInput = useMemo<SimInput | null>(() => {
    const explicitRemaining = ledger.pending.map((x) => ({ units: x.course.units, mean: x.midterm }));
    const yearsEntered = ledger.yearsWithSubjectsCount ?? 0;
    const missingYears = yearsEntered > 0 && yearsEntered < 4 ? 4 - yearsEntered : 0;
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
    return (
      <LandingPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onEnter={() => navigate(true, 'grades')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neu-bg)] pb-24 text-[var(--neu-ink)] lg:pb-12">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onHome={() => navigate(false, 'grades')}
        onExport={onExport}
        onImport={onImport}
        onClear={onClear}
      />

      <main className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8">
        <SummaryStrip ledger={ledger} mode={mode} target={target} />

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Student-built Years, Semesters & Subjects */}
          <section
            className={cx('min-w-0 lg:col-span-7 xl:col-span-8', mobileTab !== 'grades' && 'hidden lg:block')}
            aria-label="Your Subjects and Grades"
          >
            <CurriculumMatrix
              years={state.years}
              mode={mode}
              dispatch={dispatch}
              isMobileActive={mobileTab === 'grades'}
            />
          </section>

          {/* Right Column: Goal, What-If, and Forecast */}
          <aside
            className={cx(
              'min-w-0 space-y-6 lg:col-span-5 xl:col-span-4',
              mobileTab === 'grades' && 'hidden lg:block',
            )}
          >
            <div className="space-y-6">
              <div className={cx('space-y-6', mobileTab !== 'goal' && 'hidden lg:block')}>
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
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
          className="animate-pop-in neu-card fixed right-3 bottom-20 left-3 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs text-[var(--neu-ink)] sm:right-6 sm:left-auto sm:w-96 lg:bottom-6"
        >
          <span
            className={cx(
              'font-medium leading-snug',
              toast.tone === 'error' ? 'text-[var(--neu-danger)]' : 'truncate text-[var(--neu-ink)]',
            )}
          >
            {toast.message}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {toast.canUndo && (
              <button
                type="button"
                onClick={undo}
                className="neu-btn-accent inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold"
              >
                <RotateCcw size={12} aria-hidden="true" /> Undo
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="neu-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--neu-border)] bg-[var(--neu-bg)]/95 backdrop-blur-sm lg:hidden"
      >
        <div className="grid h-16 grid-cols-3">
          <button
            type="button"
            onClick={() => navigate(true, 'grades')}
            aria-current={mobileTab === 'grades' ? 'page' : undefined}
            className={cx(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              mobileTab === 'grades' ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]',
            )}
          >
            <span
              className={cx(
                'inline-flex h-7 w-12 items-center justify-center rounded-full',
                mobileTab === 'grades' ? 'neu-pressed text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]',
              )}
            >
              <BookOpen size={15} className="shrink-0" aria-hidden="true" />
            </span>
            <span>Subjects</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(true, 'goal')}
            aria-current={mobileTab === 'goal' ? 'page' : undefined}
            className={cx(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              mobileTab === 'goal' ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]',
            )}
          >
            <span
              className={cx(
                'inline-flex h-7 w-12 items-center justify-center rounded-full',
                mobileTab === 'goal' ? 'neu-pressed text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]',
              )}
            >
              <Target size={15} className="shrink-0" aria-hidden="true" />
            </span>
            <span>Goal &amp; Test</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(true, 'probability')}
            aria-current={mobileTab === 'probability' ? 'page' : undefined}
            className={cx(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              mobileTab === 'probability' ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]',
            )}
          >
            <span
              className={cx(
                'inline-flex h-7 w-12 items-center justify-center rounded-full',
                mobileTab === 'probability' ? 'neu-pressed text-[var(--neu-accent)]' : 'text-[var(--neu-ink-muted)]',
              )}
            >
              <TrendingUp size={15} className="shrink-0" aria-hidden="true" />
            </span>
            <span>Probability</span>
          </button>
        </div>
      </nav>

      <footer className="mt-12 border-t border-[var(--neu-border)] sm:mt-16">
        <div className="mx-auto flex max-w-[1360px] items-center justify-center px-4 py-5 text-center text-xs text-[var(--neu-ink-muted)] sm:justify-start sm:px-6 md:px-8">
          <span>100% Private: Your subjects and grades are saved only in your browser.</span>
        </div>
      </footer>
    </div>
  );
}

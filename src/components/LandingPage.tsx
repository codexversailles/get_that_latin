import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  BookOpen,
  Cpu,
  Database,
  FileCode2,
  Lightbulb,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { useEscapeKey, useScrollLock } from './ui';

const TECH_STACK = [
  { icon: Atom, name: 'React 19' },
  { icon: FileCode2, name: 'TypeScript' },
  { icon: Zap, name: 'Vite' },
  { icon: Palette, name: 'Tailwind CSS' },
  { icon: Cpu, name: 'Web Workers' },
  { icon: Database, name: 'LocalStorage & Zod' },
];

export function LandingPage({
  theme,
  onToggleTheme,
  onEnter,
}: {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onEnter: () => void;
}) {
  const [aboutSiteOpen, setAboutSiteOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  useScrollLock(aboutSiteOpen || tipOpen);
  useEscapeKey(aboutSiteOpen, () => setAboutSiteOpen(false));
  useEscapeKey(tipOpen, () => setTipOpen(false));

  const handleStart = () => {
    setTipOpen(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--neu-bg)] px-6 text-[var(--neu-ink)]">
      {/* Top-right theme switch */}
      <div className="fixed top-5 right-5 z-20">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="neu-btn inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--neu-ink)]"
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
      </div>

      {/* Tactile Neumorphic Centerpiece */}
      <main className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="neu-card animate-intro-title w-full rounded-3xl px-7 py-10 sm:px-9 sm:py-12">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--neu-ink)] sm:text-6xl">
            GetThat<span className="text-[var(--neu-accent)]">Latin</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--neu-ink-muted)]">
            Private GWA forecaster and Latin honors simulator for USTP students.
          </p>

          <div className="mt-8 flex w-full flex-col items-center gap-4">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={handleStart}
              className="neu-btn-accent animate-intro-cta group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold tracking-wide"
            >
              <span>I want that latin</span>
              <ArrowRight
                size={16}
                strokeWidth={2.25}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>

            {/* 2 Secondary Buttons Underneath */}
            <div className="animate-intro-dev grid w-full grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setAboutSiteOpen(true)}
                className="neu-btn group inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--neu-ink)]"
              >
                <BookOpen
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-[var(--neu-accent)]"
                />
                <span>About app</span>
              </button>

              <a
                href="https://portfolio-romaues.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn group inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--neu-ink)]"
              >
                <span>About the dev</span>
                <ArrowUpRight
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-[var(--neu-accent)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* About GetThatLatin Modal */}
      {aboutSiteOpen && (
        <div
          className="animate-backdrop fixed inset-0 z-50 overflow-y-auto bg-[var(--neu-backdrop)] p-3 backdrop-blur-xs overscroll-contain sm:p-6"
          onClick={() => setAboutSiteOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="About GetThatLatin"
              className="animate-pop-in neu-card my-auto w-full max-w-2xl rounded-3xl p-5 text-left sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3.5">
                <h2 className="text-base font-bold tracking-tight text-[var(--neu-ink)] sm:text-lg">
                  About GetThat<span className="text-[var(--neu-accent)]">Latin</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setAboutSiteOpen(false)}
                  className="neu-btn inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
                  aria-label="Close modal"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 space-y-5 text-xs leading-relaxed text-[var(--neu-ink-muted)]">
                <section>
                  <h3 className="text-xs font-semibold text-[var(--neu-accent)]">Purpose</h3>
                  <p className="mt-1.5 text-[var(--neu-ink)]">
                    Built for <strong>USTP (University of Science and Technology of Southern Philippines)</strong>{' '}
                    students, regular and irregular, to track their GWA by year and semester, test future grades,
                    and solve the exact average needed to graduate with Latin Honors.
                  </p>
                </section>

                <section className="border-t border-[var(--neu-border)] pt-4">
                  <h3 className="text-xs font-semibold text-[var(--neu-accent)]">How it calculates</h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                    <li className="neu-recessed rounded-2xl p-3.5">
                      <div className="font-semibold text-[var(--neu-ink)]">1. Weighted GWA</div>
                      <div className="mt-1 font-mono text-[11px] font-semibold text-[var(--neu-accent)]">
                        Σ(Units × Grade) ÷ ΣUnits
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--neu-ink-muted)]">
                        USTP <span className="font-mono text-[var(--neu-ink)]">1.00–3.00</span> (
                        <span className="font-mono text-[var(--neu-ink)]">0.25</span> step) scale. Excludes NSTP per RA
                        9163 and flags <span className="font-mono text-[var(--neu-danger)]">5.00</span> /{' '}
                        <span className="font-mono text-[var(--neu-warn)]">INC</span>.
                      </p>
                    </li>

                    <li className="neu-recessed rounded-2xl p-3.5">
                      <div className="font-semibold text-[var(--neu-ink)]">2. Target solver</div>
                      <div className="mt-1 font-mono text-[11px] font-semibold text-[var(--neu-accent)]">
                        (T·Units - Pts) ÷ Rem
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--neu-ink-muted)]">
                        Solves the exact average needed in ungraded units for Summa Cum Laude (
                        <span className="font-mono text-[var(--neu-ink)]">≤1.25</span>), Magna Cum Laude (
                        <span className="font-mono text-[var(--neu-ink)]">≤1.50</span>), or Cum Laude (
                        <span className="font-mono text-[var(--neu-ink)]">≤1.75</span>).
                      </p>
                    </li>

                    <li className="neu-recessed rounded-2xl p-3.5">
                      <div className="font-semibold text-[var(--neu-ink)]">3. Monte Carlo</div>
                      <div className="mt-1 font-mono text-[11px] font-semibold text-[var(--neu-accent)]">
                        30,000+ Box-Muller runs
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--neu-ink-muted)]">
                        Simulates thousands of graduation outcomes from your historical grade mean and consistency.
                      </p>
                    </li>
                  </ul>
                </section>

                <section className="border-t border-[var(--neu-border)] pt-4">
                  <h3 className="text-xs font-semibold text-[var(--neu-accent)]">Privacy</h3>
                  <div className="neu-recessed mt-2 flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-xs text-[var(--neu-ink)]">
                    <ShieldCheck size={15} className="shrink-0 text-[var(--neu-accent)]" aria-hidden="true" />
                    <span>
                      <strong>100% client-side:</strong> Runs entirely in your browser with zero backend servers. Your
                      subjects and grades never leave your device.
                    </span>
                  </div>
                </section>

                <section className="border-t border-[var(--neu-border)] pt-4">
                  <h3 className="text-xs font-semibold text-[var(--neu-accent)]">Tech stack</h3>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {TECH_STACK.map(({ icon: Icon, name }) => (
                      <span
                        key={name}
                        className="neu-recessed inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--neu-ink)]"
                      >
                        <Icon size={13} className="shrink-0 text-[var(--neu-accent)]" aria-hidden="true" />
                        <span>{name}</span>
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[var(--neu-border)] pt-4">
                <button
                  type="button"
                  onClick={() => setAboutSiteOpen(false)}
                  className="neu-btn h-10 rounded-full px-5 text-xs font-semibold text-[var(--neu-ink)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAboutSiteOpen(false);
                    handleStart();
                  }}
                  className="neu-btn-accent inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold"
                >
                  <span>I want that latin</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tip Modal before entering dashboard */}
      {tipOpen && (
        <div
          className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[var(--neu-backdrop)] p-4 backdrop-blur-xs touch-none overscroll-none"
          onClick={() => setTipOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick tip"
            className="animate-pop-in neu-card w-full max-w-md rounded-3xl p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="neu-recessed flex h-8 w-8 items-center justify-center rounded-xl text-[var(--neu-accent)]">
                  <Lightbulb size={16} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold tracking-tight text-[var(--neu-ink)]">Quick tip</h3>
              </div>
              <button
                type="button"
                onClick={() => setTipOpen(false)}
                className="neu-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
                aria-label="Close modal"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[var(--neu-ink)]">
              For best accuracy, <strong>add all your subjects across your entire curriculum first</strong> (both
              completed grades and upcoming terms).
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-[var(--neu-ink-muted)]">
              Only have your current grades right now? The app will still calculate your running GWA and current
              standing, though target grade solving needs your remaining ungraded units.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--neu-border)] pt-4">
              <button
                type="button"
                onClick={() => setTipOpen(false)}
                className="neu-btn h-10 rounded-full px-5 text-xs font-semibold text-[var(--neu-ink)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipOpen(false);
                  onEnter();
                }}
                className="neu-btn-accent inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold"
              >
                <span>Got it</span>
                <Sparkles size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

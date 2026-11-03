import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Atom, BookOpen, Cpu, Database, FileCode2, Lightbulb, Palette, ShieldCheck, Sparkles, Zap, X } from 'lucide-react';
import { useScrollLock } from './ui';

const TECH_STACK = [
  { icon: Atom, name: 'React 19', role: 'Interactive UI & state management' },
  { icon: FileCode2, name: 'TypeScript', role: 'Strict type-safe academic engine' },
  { icon: Zap, name: 'Vite', role: 'Zero-latency bundling & instant builds' },
  { icon: Palette, name: 'Tailwind CSS', role: '60/30/10 minimalist styling' },
  { icon: Cpu, name: 'Web Workers', role: 'Background 30,000-run Monte Carlo thread' },
  { icon: Database, name: 'LocalStorage & Zod', role: '100% private on-device persistence' },
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [aboutSiteOpen, setAboutSiteOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  useScrollLock(aboutSiteOpen || tipOpen);

  const handleStart = () => {
    setTipOpen(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-obsidian px-6 text-slate-100">
      {/* Soft #191851 ambient halo on the 60% black canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(25, 24, 81, 0.72) 0%, rgba(25, 24, 81, 0.22) 38%, rgba(9, 10, 15, 0) 70%)',
        }}
      />

      {/* Minimal Centerpiece */}
      <main className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <h1 className="animate-intro-title text-5xl font-bold tracking-tight text-white sm:text-7xl">
          GetThat<span className="text-gold-400">Latin</span>
        </h1>

        <div className="mt-10 flex w-full max-w-[22.5rem] flex-col items-center gap-3.5">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleStart}
            className="animate-intro-cta group inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-gold-400 px-6 text-sm font-bold tracking-wide text-obsidian shadow-[0_0_24px_rgba(244,181,42,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-[0_0_32px_rgba(244,181,42,0.38)] active:translate-y-0"
          >
            <span>I want that latin</span>
            <ArrowRight
              size={16}
              strokeWidth={2.25}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>

          {/* 2 Secondary Buttons Underneath: About GetThatLatin & About the Dev */}
          <div className="animate-intro-dev grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAboutSiteOpen(true)}
              className="group inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-white/12 bg-[#191851]/80 px-3.5 text-xs font-medium whitespace-nowrap text-slate-200 backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-400/70 hover:bg-[#191851] hover:text-gold-400"
            >
              <BookOpen size={13} className="shrink-0 text-gold-400/80 transition-colors group-hover:text-gold-400" />
              <span>About GetThatLatin</span>
            </button>

            <a
              href="https://portfolio-romaues.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-white/12 bg-[#191851]/80 px-3.5 text-xs font-medium whitespace-nowrap text-slate-200 backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-400/70 hover:bg-[#191851] hover:text-gold-400"
            >
              <span>About the Dev</span>
              <ArrowUpRight
                size={13}
                className="shrink-0 text-gold-400/80 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-400"
              />
            </a>
          </div>
        </div>
      </main>

      {/* Clean, Minimalist About GetThatLatin Modal */}
      {aboutSiteOpen && (
        <div
          className="animate-backdrop fixed inset-0 z-50 overflow-y-auto bg-obsidian/85 p-3 backdrop-blur-xs overscroll-contain sm:p-6"
          onClick={() => setAboutSiteOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="animate-pop-in my-auto w-full max-w-2xl rounded-2xl border border-navy-800 bg-obsidian p-5 text-left shadow-2xl sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">
                  About GetThat<span className="text-gold-400">Latin</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setAboutSiteOpen(false)}
                  className="cursor-pointer p-1.5 text-slate-400 transition-colors hover:text-gold-400 active:scale-95"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300">
                {/* Purpose */}
                <section>
                  <h3 className="font-mono text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
                    Purpose
                  </h3>
                  <p className="mt-1.5 text-slate-200">
                    Built specifically for <strong>USTP (University of Science and Technology of Southern Philippines)</strong> students—both regular and irregular—to track their GWA by year and semester, test future grades, and know the exact average needed to graduate with Latin Honors.
                  </p>
                </section>

                {/* How It Formulates Everything */}
                <section className="border-t border-navy-800/80 pt-4">
                  <h3 className="font-mono text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
                    How It Formulates Everything
                  </h3>
                  <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                    <li className="rounded-xl border border-navy-800 bg-navy-950/80 p-3">
                      <div className="font-semibold text-white">1. Weighted GWA</div>
                      <div className="mt-1 font-mono text-[11px] text-gold-400">
                        Σ(Units × Grade) ÷ ΣUnits
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        USTP <span className="font-mono text-slate-200">1.00–3.00</span> (<span className="font-mono text-slate-200">0.25</span> step) scale. Excludes NSTP per RA 9163 and flags <span className="font-mono text-rose-400">5.00</span> / <span className="font-mono text-amber-300">INC</span>.
                      </p>
                    </li>

                    <li className="rounded-xl border border-navy-800 bg-navy-950/80 p-3">
                      <div className="font-semibold text-white">2. Target Solver</div>
                      <div className="mt-1 font-mono text-[11px] text-gold-400">
                        (T·Units − Pts) ÷ Rem
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Solves the exact average needed in ungraded units for Summa Cum Laude (<span className="font-mono text-slate-200">≤1.25</span>), Magna Cum Laude (<span className="font-mono text-slate-200">≤1.50</span>), or Cum Laude (<span className="font-mono text-slate-200">≤1.75</span>).
                      </p>
                    </li>

                    <li className="rounded-xl border border-navy-800 bg-navy-950/80 p-3">
                      <div className="font-semibold text-white">3. Monte Carlo</div>
                      <div className="mt-1 font-mono text-[11px] text-gold-400">
                        30,000+ Box–Muller Runs
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Simulates thousands of graduation outcomes from your historical grade mean and consistency.
                      </p>
                    </li>
                  </ul>
                </section>

                {/* How It Runs */}
                <section className="border-t border-navy-800/80 pt-4">
                  <h3 className="font-mono text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
                    How It Runs
                  </h3>
                  <div className="mt-2 flex items-center gap-2.5 border border-navy-800 bg-navy-950/80 px-3 py-2.5 text-xs text-slate-300">
                    <ShieldCheck size={15} className="shrink-0 text-gold-400" />
                    <span>
                      <strong>100% Client-Side &amp; Private:</strong> Runs entirely in your browser with zero backend servers—your subjects and grades never leave your device.
                    </span>
                  </div>
                </section>

                {/* Tech Stack (Bulleted with Icons) */}
                <section className="border-t border-navy-800/80 pt-4">
                  <h3 className="font-mono text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
                    Tech Stack
                  </h3>
                  <ul className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TECH_STACK.map(({ icon: Icon, name, role }) => (
                      <li
                        key={name}
                        className="flex items-center gap-2.5 border border-navy-800 bg-navy-950/70 px-3 py-2"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                        <Icon size={14} className="shrink-0 text-gold-400" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="ml-1.5 text-[11px] text-slate-400">— {role}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Footer */}
              <div className="mt-5 flex justify-end gap-2.5 border-t border-navy-800 pt-3.5">
                <button
                  type="button"
                  onClick={() => setAboutSiteOpen(false)}
                  className="h-9 cursor-pointer border border-navy-700 bg-navy-900 px-4 text-xs font-medium text-slate-200 hover:border-slate-500"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAboutSiteOpen(false);
                    handleStart();
                  }}
                  className="h-9 cursor-pointer bg-gold-400 px-4 text-xs font-semibold text-obsidian hover:bg-gold-300"
                >
                  I want that latin →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal before entering dashboard */}
      {tipOpen && (
        <div
          className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 p-4 backdrop-blur-xs touch-none overscroll-none"
          onClick={() => setTipOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="animate-pop-in w-full max-w-md rounded-2xl border border-navy-800 bg-obsidian p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400/15 text-gold-400">
                  <Lightbulb size={16} />
                </span>
                <h3 className="font-mono text-sm font-bold tracking-tight text-white uppercase">
                  Quick Tip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTipOpen(false)}
                className="cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:text-gold-400"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3.5 text-xs leading-relaxed text-slate-200">
              For best accuracy, <strong>add all your subjects across your entire curriculum first</strong> (both completed grades and upcoming terms).
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              💡 <em>Only have your current grades right now?</em> No problem—the system will still calculate your official running GWA and current standing, but without knowing your remaining uncompleted units, it won't be able to solve your exact target grade requirements yet.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-navy-800 pt-3.5">
              <button
                type="button"
                onClick={() => setTipOpen(false)}
                className="h-9 cursor-pointer rounded-full border border-navy-700 bg-navy-900 px-4 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipOpen(false);
                  onEnter();
                }}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-gold-400 px-4 text-xs font-bold text-obsidian transition-all hover:bg-gold-300 active:scale-95"
              >
                <span>Got it</span>
                <Sparkles size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

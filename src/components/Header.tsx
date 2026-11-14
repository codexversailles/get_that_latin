import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Lock, Moon, MoreVertical, Sun, Trash2, Upload, X } from 'lucide-react';
import { Button, useEscapeKey, useScrollLock } from './ui';

export function Header({
  theme,
  onToggleTheme,
  onHome,
  onExport,
  onImport,
  onClear,
}: {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onHome: () => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  useScrollLock(sheetOpen);
  useEscapeKey(sheetOpen, () => setSheetOpen(false));

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--neu-border)] bg-[var(--neu-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-2 px-4 py-3 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onHome}
            title="Return to intro page"
            className="text-base font-bold tracking-tight text-[var(--neu-ink)] transition-opacity hover:opacity-80"
          >
            GetThat<span className="text-[var(--neu-accent)]">Latin</span>
          </button>
          <span
            className="neu-recessed hidden items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] text-[var(--neu-ink-muted)] sm:inline-flex"
            title="100% private. Your subjects and grades stay on your device."
          >
            <Lock size={10} className="text-[var(--neu-accent)]" aria-hidden="true" />
            <span>Saved on device</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="neu-btn inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--neu-ink)]"
          >
            {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2.5 md:flex">
            <Button onClick={onExport} title="Save a backup file of your subjects and grades">
              <Download size={13} strokeWidth={1.85} aria-hidden="true" /> Backup
            </Button>
            <Button onClick={() => fileRef.current?.click()} title="Load subjects and grades from a backup file">
              <Upload size={13} strokeWidth={1.85} aria-hidden="true" /> Restore
            </Button>
            <Button danger onClick={onClear} title="Clear all subjects and grades">
              <Trash2 size={13} strokeWidth={1.85} aria-hidden="true" /> Reset
            </Button>
          </div>

          {/* Mobile Modal Bottom Sheet Trigger */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Open data and backup menu"
              className="neu-btn inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--neu-ink)]"
            >
              <MoreVertical size={16} aria-hidden="true" />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {sheetOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="animate-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[var(--neu-backdrop)] backdrop-blur-xs touch-none overscroll-none md:hidden"
            onClick={() => setSheetOpen(false)}
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) e.preventDefault();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Records and backup"
              className="animate-sheet-up neu-card w-full max-w-lg rounded-t-3xl p-5 pb-8 touch-pan-y overscroll-contain"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="neu-recessed mx-auto mb-4 h-1.5 w-10 rounded-full" />

              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--neu-accent)]">Records &amp; Backup</span>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="neu-btn inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--neu-ink-muted)]"
                  aria-label="Close sheet"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    onExport();
                  }}
                  className="neu-btn flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left"
                >
                  <span className="neu-recessed flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--neu-accent)]">
                    <Download size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--neu-ink)]">Backup grades</div>
                    <div className="text-xs text-[var(--neu-ink-muted)]">
                      Download your subjects and grades as a JSON file
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    fileRef.current?.click();
                  }}
                  className="neu-btn flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left"
                >
                  <span className="neu-recessed flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--neu-accent)]">
                    <Upload size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--neu-ink)]">Restore backup</div>
                    <div className="text-xs text-[var(--neu-ink-muted)]">Import a saved GetThatLatin JSON file</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    onClear();
                  }}
                  className="neu-btn flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left"
                >
                  <span className="neu-recessed flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--neu-danger)]">
                    <Trash2 size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--neu-danger)]">Reset all data</div>
                    <div className="text-xs text-[var(--neu-ink-muted)]">Clear all years and subjects (can undo)</div>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}

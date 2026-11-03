import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Lock, MoreVertical, Trash2, Upload, X } from 'lucide-react';
import { Button } from './ui';

export function Header({
  onHome,
  onExport,
  onImport,
  onClear,
}: {
  onHome: () => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-navy-800 bg-navy-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onHome}
            title="Return to intro page"
            className="cursor-pointer text-base font-bold tracking-tight text-white transition-opacity hover:opacity-85"
          >
            GetThat<span className="text-gold-400">Latin</span>
          </button>
          <span
            className="hidden items-center gap-1 rounded-full border border-navy-700 bg-navy-900 px-2.5 py-0.5 font-mono text-[10px] text-slate-300 sm:inline-flex"
            title="100% private. Your subjects and grades stay on your device."
          >
            <Lock size={9} className="text-gold-400" /> Saved on device
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop actions */}
          <div className="hidden items-center gap-1.5 md:flex">
            <Button onClick={onExport} title="Save a backup file of your subjects and grades">
              <Download size={13} strokeWidth={1.75} /> Backup
            </Button>
            <Button onClick={() => fileRef.current?.click()} title="Load subjects and grades from a backup file">
              <Upload size={13} strokeWidth={1.75} /> Restore
            </Button>
            <Button danger onClick={onClear} title="Clear all subjects and grades">
              <Trash2 size={13} strokeWidth={1.75} /> Reset
            </Button>
          </div>

          {/* Mobile Modal Bottom Sheet Trigger */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Open data and backup menu"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-navy-800 bg-navy-900 text-slate-200 transition-transform active:scale-95"
            >
              <MoreVertical size={16} />
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

      {/* Render Mobile Bottom Sheet via Portal in document.body so sticky header backdrop-blur never clips it */}
      {sheetOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="animate-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs md:hidden"
            onClick={() => setSheetOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Records and backup"
              className="animate-sheet-up w-full max-w-lg rounded-t-2xl border-t border-navy-700 bg-obsidian-soft p-5 pb-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Handle */}
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-navy-700" />

              <div className="mb-3.5 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold tracking-wider text-gold-400 uppercase">
                  Records &amp; Backup
                </span>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-navy-800 bg-navy-950 text-slate-400 hover:text-white"
                  aria-label="Close sheet"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    onExport();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-navy-800 bg-navy-950 p-3.5 text-left transition-all hover:border-navy-700 active:scale-[0.99] active:bg-navy-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400">
                    <Download size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Backup Grades</div>
                    <div className="text-xs text-slate-400">
                      Download your subjects &amp; grades as a JSON file
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    fileRef.current?.click();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-navy-800 bg-navy-950 p-3.5 text-left transition-all hover:border-navy-700 active:scale-[0.99] active:bg-navy-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400">
                    <Upload size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Restore Backup</div>
                    <div className="text-xs text-slate-400">Import a saved GetThatLatin JSON file</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    onClear();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-left transition-all hover:border-rose-500/40 active:scale-[0.99] active:bg-rose-500/20"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                    <Trash2 size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-rose-300">Reset All Data</div>
                    <div className="text-xs text-rose-300/70">Clear all years and subjects (can Undo)</div>
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

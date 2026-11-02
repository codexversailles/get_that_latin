import { useRef, useState } from 'react';
import { Download, Lock, MoreVertical, Trash2, Upload } from 'lucide-react';
import type { HonorsMode } from '../engine';
import { Button, Segmented } from './ui';

export function Header({
  mode,
  onMode,
  onHome,
  onExport,
  onImport,
  onClear,
}: {
  mode: HonorsMode;
  onMode: (m: HonorsMode) => void;
  onHome: () => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-navy-800 bg-navy-950/90 backdrop-blur">
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
            className="hidden items-center gap-1 border border-navy-700 bg-navy-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 sm:inline-flex"
            title="100% private. Your subjects and grades stay on your device."
          >
            <Lock size={9} className="text-gold-400" /> Saved on device
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop / Tablet NSTP Segmented Toggle */}
          <div className="hidden sm:block">
            <Segmented<HonorsMode>
              value={mode}
              onChange={onMode}
              options={[
                {
                  value: 'academic',
                  label: 'Exclude NSTP',
                  title: 'Official Latin Honors GWA (excludes NSTP subjects per RA 9163)',
                },
                {
                  value: 'institutional',
                  label: 'Include All',
                  title: 'Includes every subject in your GWA',
                },
              ]}
            />
          </div>

          {/* Mobile compact mode toggle pill */}
          <button
            type="button"
            onClick={() => onMode(mode === 'academic' ? 'institutional' : 'academic')}
            className="inline-flex h-8 cursor-pointer items-center border border-navy-800 bg-navy-950 px-2.5 font-mono text-[11px] text-slate-300 sm:hidden"
            title="Tap to switch NSTP inclusion mode"
          >
            {mode === 'academic' ? 'No NSTP' : 'All Subj.'}
          </button>

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

          {/* Mobile actions dropdown */}
          <div className="relative md:hidden">
            <Button onClick={() => setMenuOpen((v) => !v)} title="Backup or reset" className="h-8 px-2">
              <MoreVertical size={15} />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-40 mt-1 w-48 border border-navy-700 bg-navy-950 p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onExport();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-200 hover:bg-navy-900"
                  >
                    <Download size={13} className="text-gold-400" /> Backup grades
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      fileRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-200 hover:bg-navy-900"
                  >
                    <Upload size={13} className="text-gold-400" /> Restore backup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onClear();
                    }}
                    className="flex w-full items-center gap-2 border-t border-navy-800 px-3 py-2 text-left text-xs text-rose-400 hover:bg-navy-900"
                  >
                    <Trash2 size={13} /> Reset all data
                  </button>
                </div>
              </>
            )}
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
    </header>
  );
}

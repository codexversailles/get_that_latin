import { buildStudentLedger, classifyGwa } from '../engine';
import { parseState, type AppState } from './storage';

/** Build a self-describing transcript export (student years + computed summary). */
export function buildExport(state: AppState) {
  const summary = (['academic', 'institutional'] as const).map((mode) => {
    const l = buildStudentLedger(state.years, mode);
    return {
      mode,
      gwa: l.gwa,
      completedUnits: l.completedUnits,
      totalUnits: l.totalUnits,
      standing: l.hardDisqualified ? null : (classifyGwa(l.gwa)?.label ?? null),
      disqualifiers: l.disqualifiers,
    };
  });

  return {
    app: 'GetThatLatin',
    format: 'getthatlatin-transcript-v2',
    exportedAt: new Date().toISOString(),
    summary,
    state,
  };
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Accepts either a full transcript export or a raw state object. */
export async function readImport(file: File): Promise<AppState> {
  const raw = JSON.parse(await file.text()) as unknown;
  const candidate =
    raw && typeof raw === 'object' && 'state' in raw ? (raw as { state: unknown }).state : raw;
  const state = parseState(candidate);
  if (!state) throw new Error('This file is not a valid GetThatLatin backup file.');
  return state;
}

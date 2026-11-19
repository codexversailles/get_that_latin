import { useEffect, useRef, useState } from 'react';
import { runMonteCarlo, type SimInput, type SimResult } from '../engine';
import type { WorkerRequest, WorkerResponse } from '../engine/worker';

/**
 * Runs the Monte Carlo simulation in a Web Worker.
 * Requests are coalesced: while one job is in flight only the *latest* input is queued,
 * so dragging a slider never builds a backlog and the main thread stays at 60 FPS.
 */
export function useMonteCarlo(input: SimInput | null): { result: SimResult | null; busy: boolean } {
  const [result, setResult] = useState<SimResult | null>(null);
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const inflight = useRef(false);
  const inflightInput = useRef<SimInput | null>(null);
  const queued = useRef<SimInput | null>(null);
  const seq = useRef(0);
  const send = useRef<(i: SimInput) => void>(() => {});

  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' });
    } catch {
      worker = null;
    }
    workerRef.current = worker;

    const runInline = (i: SimInput) => {
      inflight.current = false;
      inflightInput.current = null;
      setResult(runMonteCarlo(i));
      setBusy(false);
    };

    send.current = (i: SimInput) => {
      if (!workerRef.current) return runInline(i);
      inflight.current = true;
      inflightInput.current = i;
      setBusy(true);
      const msg: WorkerRequest = { id: ++seq.current, input: i };
      workerRef.current.postMessage(msg);
    };

    if (worker) {
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        setResult(e.data.result);
        inflight.current = false;
        inflightInput.current = null;
        const next = queued.current;
        queued.current = null;
        if (next) send.current(next);
        else setBusy(false);
      };
      worker.onerror = () => {
        worker?.terminate();
        workerRef.current = null;
        const fallback = queued.current ?? inflightInput.current;
        inflight.current = false;
        inflightInput.current = null;
        queued.current = null;
        if (fallback) runInline(fallback);
        else setBusy(false);
      };
    }

    return () => {
      worker?.terminate();
      workerRef.current = null;
      inflight.current = false;
      inflightInput.current = null;
      queued.current = null;
    };
  }, []);

  useEffect(() => {
    if (!input) {
      queued.current = null;
      setResult(null);
      setBusy(false);
      return;
    }
    if (inflight.current) queued.current = input;
    else send.current(input);
  }, [input]);

  return { result, busy };
}

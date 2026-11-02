/// <reference lib="webworker" />
import { runMonteCarlo, type SimInput, type SimResult } from './montecarlo';

export interface WorkerRequest {
  id: number;
  input: SimInput;
}
export interface WorkerResponse {
  id: number;
  result: SimResult;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, input } = e.data;
  const result = runMonteCarlo(input);
  const msg: WorkerResponse = { id, result };
  ctx.postMessage(msg);
};

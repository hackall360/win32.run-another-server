import { ipi } from '../src/lib/hal/index.js';

const dpcQueues = new Map();

export function queueDpc(fn, cpuId = 0) {
  if (!dpcQueues.has(cpuId)) dpcQueues.set(cpuId, []);
  dpcQueues.get(cpuId).push(fn);
  ipi.send(cpuId, 'dpc');
}

export function processDpcs(cpuId = 0) {
  const queue = dpcQueues.get(cpuId);
  if (!queue || queue.length === 0) return;
  while (queue.length > 0) {
    const fn = queue.shift();
    try {
      fn();
    } catch {
      // ignore errors in DPCs
    }
  }
}

export function hasPendingDpcs(cpuId = 0) {
  const q = dpcQueues.get(cpuId);
  return !!(q && q.length > 0);
}

export default { queueDpc, processDpcs, hasPendingDpcs };

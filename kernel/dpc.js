const dpcQueue = [];

export function queueDpc(fn) {
  dpcQueue.push(fn);
}

export function processDpcs() {
  while (dpcQueue.length > 0) {
    const fn = dpcQueue.shift();
    try {
      fn();
    } catch {
      // ignore errors in DPCs
    }
  }
}

export function hasPendingDpcs() {
  return dpcQueue.length > 0;
}

export default { queueDpc, processDpcs, hasPendingDpcs };

const apcQueues = new Map();

export function queueApc(thread, fn) {
  if (!apcQueues.has(thread)) {
    apcQueues.set(thread, []);
  }
  apcQueues.get(thread).push(fn);
}

export function deliverApcs(thread) {
  const queue = apcQueues.get(thread);
  if (!queue || queue.length === 0) return;
  while (queue.length > 0) {
    const fn = queue.shift();
    try {
      fn();
    } catch {
      // ignore errors in APCs
    }
  }
}

export function hasPendingApcs(thread) {
  const q = apcQueues.get(thread);
  return !!(q && q.length > 0);
}

export default { queueApc, deliverApcs, hasPendingApcs };

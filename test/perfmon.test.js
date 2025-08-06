import { test } from 'node:test';
import assert from 'node:assert';
import { syscall } from '../system/syscall.js';
import { registerPerfMon } from '../system/services/perfmon.js';
import * as perfmon from '../usermode/win32/perfmon.js';

registerPerfMon(syscall);

test('perfmon returns counters', () => {
  const counters = perfmon.GetPerformanceCounters();
  assert.ok(counters.cpu);
  assert.ok(counters.memory);
  assert.ok(counters.io);
  assert.equal(typeof counters.timestamp, 'bigint');
});

test('perfmon sampling collects data', async () => {
  perfmon.StartSampling(5);
  await new Promise(r => setTimeout(r, 20));
  const samples = perfmon.StopSampling();
  assert.ok(samples.length > 0);
  for (const sample of samples) {
    assert.equal(typeof sample.timestamp, 'bigint');
  }
});

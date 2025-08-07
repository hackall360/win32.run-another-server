import { test } from 'node:test';
import assert from 'node:assert';
import { queueApc } from '../kernel/apc.js';
import { queueDpc } from '../kernel/dpc.js';
import { Scheduler } from '../kernel/scheduler.js';
import { Thread } from '../kernel/thread.js';

test('alertable wait delivers APCs', async () => {
  const sched = new Scheduler();
  const proc = sched.createProcess(1);
  const t = new Thread(() => {}, sched);
  proc.addThread(t);
  sched.current = proc;
  let called = false;
  queueApc(t, () => { called = true; });
  const result = await t.wait(null, undefined, true);
  assert.ok(called);
  assert.strictEqual(result, 'apc');
});

test('scheduler processes queued DPCs', () => {
  const sched = new Scheduler();
  let ran = false;
  queueDpc(() => { ran = true; });
  sched.schedule();
  assert.ok(ran);
});

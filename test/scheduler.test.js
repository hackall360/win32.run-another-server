import { test } from 'node:test';
import assert from 'node:assert';
import { Scheduler, Mutex, Semaphore, Spinlock } from '../kernel/scheduler.js';
import { Thread } from '../kernel/thread.js';
import { KernelEvent } from '../kernel/event.js';

// Test that scheduler prioritizes higher priority processes

test('scheduler selects highest priority process first', () => {
  const sched = new Scheduler();
  sched.createProcess(1);
  sched.createProcess(5);
  sched.schedule();
  assert.strictEqual(sched.current.priority, 5);
  // Simulate current process blocking so next process can run
  sched.current.state = 'waiting';
  sched.schedule();
  assert.strictEqual(sched.current.priority, 1);
});

// Test Mutex

test('mutex enforces mutual exclusion', async () => {
  const m = new Mutex();
  const order = [];
  await m.lock();
  order.push('a');
  const later = m.lock().then(() => {
    order.push('b');
    m.unlock();
  });
  m.unlock();
  await later;
  assert.deepStrictEqual(order, ['a', 'b']);
});

// Test Semaphore

test('semaphore manages concurrent access', async () => {
  const s = new Semaphore(1);
  const order = [];
  await s.wait();
  order.push('a');
  const waiter = s.wait().then(() => {
    order.push('b');
  });
  order.push('c');
  s.signal();
  await waiter;
  assert.deepStrictEqual(order, ['a', 'c', 'b']);
});

// Test Spinlock

test('spinlock provides exclusive access', async () => {
  const lock = new Spinlock();
  let counter = 0;
  const inc = async () => {
    await lock.lock();
    const current = counter;
    await new Promise(r => setTimeout(r, 5));
    counter = current + 1;
    lock.unlock();
  };
  await Promise.all([inc(), inc()]);
  assert.strictEqual(counter, 2);
});

// Test preemption via time slice

test('scheduler preempts based on time slice', async () => {
  const sched = new Scheduler(5);
  const p1 = sched.createProcess(1);
  sched.contextSwitch(p1);
  const p2 = sched.createProcess(2);
  sched.start();
  await new Promise(r => setTimeout(r, 20));
  assert.strictEqual(sched.current, p2);
  sched.stop();
});

// Test adjusting priority and time slice

test('allows adjusting priority and time slice', async () => {
  const sched = new Scheduler(20);
  const p1 = sched.createProcess(1);
  sched.setPriority(p1, 5);
  assert.strictEqual(p1.priority, 5);
  sched.setTimeSlice(10);
  sched.start();
  await new Promise(r => setTimeout(r, 15));
  sched.stop();
  assert.strictEqual(sched.timeSliceMs, 10);
});

// Test context preservation

test('preserves thread context across preemption', () => {
  const sched = new Scheduler();
  const p1 = sched.createProcess(1);
  const t1 = new Thread(() => {});
  p1.addThread(t1);
  sched.contextSwitch(p1);
  sched.cpuContext = { registers: { ax: 1 }, sp: 100 };
  const p2 = sched.createProcess(1);
  const t2 = new Thread(() => {});
  p2.addThread(t2);
  sched.contextSwitch(p2);
  assert.deepStrictEqual(t1.context, { registers: { ax: 1 }, sp: 100 });
  sched.contextSwitch(p1);
  assert.deepStrictEqual(sched.cpuContext, { registers: { ax: 1 }, sp: 100 });
});

// Test event-based waiting

test('thread waits for event and resumes when signaled', async () => {
  const sched = new Scheduler();
  const p = sched.createProcess(1);
  const t = new Thread(() => {}, sched);
  p.addThread(t);
  sched.contextSwitch(p);
  const ev = new KernelEvent(false, sched);
  const wait = t.wait(ev);
  assert.strictEqual(t.state, 'blocked');
  ev.set();
  await wait;
  assert.strictEqual(t.state, 'ready');
});

// Test waiting on multiple objects

test('supports waiting on multiple objects', async () => {
  const sched = new Scheduler();
  const p = sched.createProcess(1);
  const t = new Thread(() => {}, sched);
  p.addThread(t);
  sched.contextSwitch(p);
  const e1 = new KernelEvent(false, sched);
  const e2 = new KernelEvent(false, sched);
  const wait = t.wait([e1, e2]);
  e2.set();
  await wait;
  assert.strictEqual(t.state, 'ready');
});

// Test timeout waiting

test('wait times out when no object signaled', async () => {
  const sched = new Scheduler();
  const p = sched.createProcess(1);
  const t = new Thread(() => {}, sched);
  p.addThread(t);
  sched.contextSwitch(p);
  const e = new KernelEvent(false, sched);
  const start = Date.now();
  await t.wait(e, 10);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 10);
  assert.strictEqual(t.state, 'ready');
});

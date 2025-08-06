import { test } from 'node:test';
import assert from 'node:assert';
import { Scheduler, Mutex, Semaphore, Spinlock } from '../kernel/scheduler.js';

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

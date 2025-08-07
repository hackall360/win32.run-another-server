import { ProcessTable } from './process.js';
import { systemToken } from './executive/security.js';
import { timer, ipi } from '../src/lib/hal/index.js';
import { logError } from '../system/eventLog.js';
import { createCrashDump } from '../system/crashDump.js';
import { KernelTimer } from './timer.js';
import { hasPendingApcs, deliverApcs } from './apc.js';
import { processDpcs } from './dpc.js';

export class Scheduler {
  constructor(timeSliceMs = 50, cpuCount = 1) {
    this.table = new ProcessTable();
    this.blockedQueue = [];
    this.waitMap = new Map();
    this.timeSliceMs = timeSliceMs;
    this.cpus = Array.from({ length: cpuCount }, (_, id) => ({
      id,
      runQueue: [],
      current: null,
      timerId: null,
      context: { registers: {}, sp: 0 }
    }));
    for (const cpu of this.cpus) {
      ipi.register(cpu.id, (_ctx, type) => {
        if (type === 'reschedule') {
          this.schedule(cpu.id);
        } else if (type === 'dpc') {
          processDpcs(cpu.id);
        }
      });
    }
  }

  get readyQueue() {
    return this.cpus[0].runQueue;
  }

  get current() {
    return this.cpus[0].current;
  }

  set current(proc) {
    this.cpus[0].current = proc;
    if (proc) proc.cpu = this.cpus[0];
  }

  get cpuContext() {
    return this.cpus[0].context;
  }

  set cpuContext(ctx) {
    this.cpus[0].context = ctx;
  }

  createProcess(priority = 0, token = systemToken, job = null, session = null) {
    try {
      const proc = this.table.createProcess(priority, token, job, session);
      this.enqueue(proc);
      return proc;
    } catch (err) {
      logError('Scheduler.createProcess', err, { priority });
      createCrashDump('scheduler_create_process', { priority });
      throw err;
    }
  }

  enqueue(proc, skipIpi = false, targetCpu = null) {
    proc.state = 'ready';
    let cpu = targetCpu;
    const thread = proc.threads[0];
    if (!cpu) {
      if (thread && typeof thread.preferredCpu === 'number' && this.cpus[thread.preferredCpu]) {
        cpu = this.cpus[thread.preferredCpu];
      } else {
        cpu = this.cpus.reduce((a, b) => {
          const loadA = a.runQueue.length + (a.current ? 1 : 0);
          const loadB = b.runQueue.length + (b.current ? 1 : 0);
          return loadA <= loadB ? a : b;
        });
      }
    }
    proc.cpu = cpu;
    cpu.runQueue.push(proc);
    cpu.runQueue.sort((a, b) => b.priority - a.priority);
    if (!skipIpi) {
      ipi.send(cpu.id, 'reschedule');
    }
  }

  blockThread(thread, object, timeout, alertable = false) {
    return new Promise(resolve => {
      if (alertable && hasPendingApcs(thread)) {
        deliverApcs(thread);
        resolve('apc');
        return;
      }
      const cpu = this.cpus.find(c => c.current && c.current.threads.includes(thread)) || this.cpus[0];
      const proc = cpu.current;
      thread.state = 'blocked';
      if (proc) {
        proc.state = 'waiting';
      }
      const objs = [];
      if (object) {
        if (Array.isArray(object)) {
          objs.push(...object);
        } else {
          objs.push(object);
        }
      }
      const record = { thread, process: proc, objects: objs, resolve };
      this.blockedQueue.push(record);
      for (const obj of objs) {
        if (!this.waitMap.has(obj)) this.waitMap.set(obj, new Set());
        this.waitMap.get(obj).add(record);
      }
      if (timeout !== undefined) {
        const kt = new KernelTimer(timeout, this);
        record.timer = kt;
        record.objects.push(kt);
        if (!this.waitMap.has(kt)) this.waitMap.set(kt, new Set());
        this.waitMap.get(kt).add(record);
      }
      this.schedule(cpu.id);
    });
  }

  onObjectSignaled(obj) {
    const records = this.waitMap.get(obj);
    if (!records) return;
    for (const record of Array.from(records)) {
      this.unblock(record, obj);
    }
  }

  unblock(record, signaledObj) {
    const idx = this.blockedQueue.indexOf(record);
    if (idx !== -1) {
      this.blockedQueue.splice(idx, 1);
    }
    for (const obj of record.objects) {
      const set = this.waitMap.get(obj);
      if (set) {
        set.delete(record);
        if (set.size === 0) this.waitMap.delete(obj);
      }
      if (obj instanceof KernelTimer) {
        obj.cancel();
      }
    }
    record.thread.state = 'ready';
    if (record.process) {
      record.process.state = 'ready';
      this.enqueue(record.process);
    }
    if (record.resolve) {
      record.resolve(signaledObj);
    }
  }

  schedule(cpuId = 0) {
    const cpu = this.cpus[cpuId];
    try {
      processDpcs(cpuId);
      if (cpu.current && cpu.current.state === 'running') {
        this.enqueue(cpu.current, true, cpu);
      }
      const next = cpu.runQueue.shift();
      if (next) {
        this.contextSwitch(next, cpuId);
      } else {
        cpu.current = null;
      }
      return cpu.current;
    } catch (err) {
      logError('Scheduler.schedule', err);
      createCrashDump('scheduler_schedule', { current: cpu.current });
      throw err;
    }
  }

  contextSwitch(proc, cpuId = 0) {
    const cpu = this.cpus[cpuId];
    if (cpu.current) {
      const thread = cpu.current.threads[0];
      if (thread) {
        thread.context = { ...cpu.context };
      }
      cpu.current.state = 'ready';
    }
    cpu.current = proc;
    proc.cpu = cpu;
    proc.state = 'running';
    const thread = proc.threads[0];
    if (thread) {
      cpu.context = { ...thread.context };
    }
  }

  start() {
    this.stop();
    for (const cpu of this.cpus) {
      const tick = () => {
        this.schedule(cpu.id);
        cpu.timerId = timer.setTimeout(tick, this.timeSliceMs);
      };
      cpu.timerId = timer.setTimeout(tick, this.timeSliceMs);
    }
  }

  stop() {
    for (const cpu of this.cpus) {
      if (cpu.timerId !== null) {
        timer.clearTimeout(cpu.timerId);
        cpu.timerId = null;
      }
    }
  }

  setTimeSlice(ms) {
    this.timeSliceMs = ms;
    if (this.cpus.some(cpu => cpu.timerId !== null)) {
      this.start();
    }
  }

  setPriority(proc, priority) {
    proc.priority = priority;
    const cpu = proc.cpu || this.cpus[0];
    cpu.runQueue.sort((a, b) => b.priority - a.priority);
  }
}

export class Mutex {
  constructor() {
    this.locked = false;
    this.waiters = [];
  }

  lock() {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waiters.push(resolve);
      }
    });
  }

  unlock() {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

export class Semaphore {
  constructor(count = 1) {
    this.count = count;
    this.waiters = [];
  }

  wait() {
    return new Promise(resolve => {
      if (this.count > 0) {
        this.count--;
        resolve();
      } else {
        this.waiters.push(resolve);
      }
    });
  }

  signal() {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift();
      next();
    } else {
      this.count++;
    }
  }
}

export class Spinlock {
  constructor() {
    this.locked = false;
  }

  async lock() {
    while (this.locked) {
      await new Promise(r => setImmediate(r));
    }
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }
}

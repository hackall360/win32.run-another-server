import { ProcessTable } from './process.js';
import { systemToken } from './executive/security.js';
import { timer } from '../src/lib/hal/index.js';
import { logError } from '../system/eventLog.js';
import { createCrashDump } from '../system/crashDump.js';
import { KernelTimer } from './timer.js';
import { hasPendingApcs, deliverApcs } from './apc.js';
import { processDpcs } from './dpc.js';

export class Scheduler {
  constructor(timeSliceMs = 50) {
    this.table = new ProcessTable();
    this.readyQueue = [];
    this.blockedQueue = [];
    this.waitMap = new Map();
    this.current = null;
    this.timeSliceMs = timeSliceMs;
    this.timerId = null;
    this.cpuContext = { registers: {}, sp: 0 };
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

  enqueue(proc) {
    proc.state = 'ready';
    this.readyQueue.push(proc);
    this.readyQueue.sort((a, b) => b.priority - a.priority);
  }

  blockThread(thread, object, timeout, alertable = false) {
    return new Promise(resolve => {
      if (alertable && hasPendingApcs(thread)) {
        deliverApcs(thread);
        resolve('apc');
        return;
      }
      const proc = this.current;
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
      this.schedule();
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

  schedule() {
    try {
      processDpcs();
      if (this.current && this.current.state === 'running') {
        this.enqueue(this.current);
      }
      const next = this.readyQueue.shift();
      if (next) {
        this.contextSwitch(next);
      } else {
        this.current = null;
      }
      return this.current;
    } catch (err) {
      logError('Scheduler.schedule', err);
      createCrashDump('scheduler_schedule', { current: this.current });
      throw err;
    }
  }

  contextSwitch(proc) {
    if (this.current) {
      const thread = this.current.threads[0];
      if (thread) {
        thread.context = { ...this.cpuContext };
      }
      this.current.state = 'ready';
    }
    this.current = proc;
    proc.state = 'running';
    const thread = proc.threads[0];
    if (thread) {
      this.cpuContext = { ...thread.context };
    }
  }

  start() {
    this.stop();
    this.timerId = timer.setTimeout(() => {
      this.schedule();
      this.start();
    }, this.timeSliceMs);
  }

  stop() {
    if (this.timerId !== null) {
      timer.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  setTimeSlice(ms) {
    this.timeSliceMs = ms;
    if (this.timerId !== null) {
      this.start();
    }
  }

  setPriority(proc, priority) {
    proc.priority = priority;
    this.readyQueue.sort((a, b) => b.priority - a.priority);
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

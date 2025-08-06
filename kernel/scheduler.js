import { ProcessTable } from './process.js';
import { systemToken } from './executive/security.js';
import { timer } from '../src/lib/hal/index.js';

export class Scheduler {
  constructor(timeSliceMs = 50) {
    this.table = new ProcessTable();
    this.readyQueue = [];
    this.current = null;
    this.timeSliceMs = timeSliceMs;
    this.timerId = null;
    this.cpuContext = { registers: {}, sp: 0 };
  }

  createProcess(priority = 0, token = systemToken) {
    const proc = this.table.createProcess(priority, token);
    this.enqueue(proc);
    return proc;
  }

  enqueue(proc) {
    proc.state = 'ready';
    this.readyQueue.push(proc);
    this.readyQueue.sort((a, b) => b.priority - a.priority);
  }

  schedule() {
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

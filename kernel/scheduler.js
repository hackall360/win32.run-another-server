import { ProcessTable } from './process.js';
import { systemToken } from './executive/security.js';

export class Scheduler {
  constructor() {
    this.table = new ProcessTable();
    this.readyQueue = [];
    this.current = null;
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
      this.current.state = 'ready';
    }
    this.current = proc;
    proc.state = 'running';
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

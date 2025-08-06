import { systemToken } from './executive/security.js';
import { isLoggedOn } from './executive/security/users.js';

export class Process {
  constructor(pid, priority = 0, token = systemToken) {
    this.pid = pid;
    this.priority = priority;
    this.state = 'ready';
    this.threads = [];
    this.context = {};
    this.token = token.getEffectiveToken();
  }

  addThread(thread) {
    this.threads.push(thread);
  }
}

export class ProcessTable {
  constructor() {
    this.processes = new Map();
    this.nextPid = 1;
  }

  createProcess(priority = 0, token = systemToken) {
    const effective = token.getEffectiveToken();
    if (effective !== systemToken && !isLoggedOn(effective)) {
      throw new Error('Invalid token');
    }
    if (!effective.hasPrivilege('createProcess')) {
      throw new Error('Access denied');
    }
    const pid = this.nextPid++;
    const process = new Process(pid, priority, effective);
    this.processes.set(pid, process);
    return process;
  }

  removeProcess(pid) {
    this.processes.delete(pid);
  }

  getProcess(pid) {
    return this.processes.get(pid);
  }

  all() {
    return Array.from(this.processes.values());
  }
}

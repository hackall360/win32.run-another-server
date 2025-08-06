import { systemToken } from './executive/security.js';
import { isLoggedOn } from './executive/security/users.js';

export class Process {
  constructor(pid, priority = 0, token = systemToken, job = null, session = null) {
    this.pid = pid;
    this.priority = priority;
    this.state = 'ready';
    this.threads = [];
    this.context = {};
    this.token = token.getEffectiveToken();
    this.job = job;
    this.session = session;
  }

  addThread(thread) {
    this.threads.push(thread);
  }

  terminate() {
    this.state = 'terminated';
    for (const t of this.threads) {
      t.state = 'terminated';
    }
  }
}

export class ProcessTable {
  constructor() {
    this.processes = new Map();
    this.nextPid = 1;
  }

  createProcess(priority = 0, token = systemToken, job = null, session = null) {
    const effective = token.getEffectiveToken();
    if (effective !== systemToken && !isLoggedOn(effective)) {
      throw new Error('Invalid token');
    }
    if (!effective.hasPrivilege('createProcess')) {
      throw new Error('Access denied');
    }
    const pid = this.nextPid++;
    const process = new Process(pid, priority, effective, job, session);
    this.processes.set(pid, process);
    if (job) {
      job.addProcess(process);
    }
    if (session) {
      session.addProcess(process);
    }
    return process;
  }

  removeProcess(pid) {
    const proc = this.processes.get(pid);
    if (proc) {
      if (proc.job) {
        proc.job.removeProcess(proc);
      }
      if (proc.session) {
        proc.session.removeProcess(proc);
      }
      this.processes.delete(pid);
    }
  }

  getProcess(pid) {
    return this.processes.get(pid);
  }

  all() {
    return Array.from(this.processes.values());
  }
}

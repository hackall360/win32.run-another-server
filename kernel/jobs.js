export class Job {
  constructor(id, parent = null, limits = {}) {
    this.id = id;
    this.parent = parent;
    this.processes = new Set();
    this.childJobs = new Set();
    this.limits = {
      maxProcesses: Infinity,
      cpuTime: Infinity,
      memory: Infinity,
      ...limits
    };
    this.accounting = {
      cpuTime: 0,
      memory: 0
    };
  }

  addProcess(proc) {
    if (this.processes.size >= this.limits.maxProcesses) {
      throw new Error('Process limit exceeded');
    }
    this.processes.add(proc);
    proc.job = this;
  }

  removeProcess(proc) {
    this.processes.delete(proc);
  }

  addJob(job) {
    this.childJobs.add(job);
  }

  recordUsage({ cpuTime = 0, memory = 0 } = {}) {
    this.accounting.cpuTime += cpuTime;
    this.accounting.memory += memory;
    if (this.accounting.cpuTime > this.limits.cpuTime ||
        this.accounting.memory > this.limits.memory) {
      this.terminate();
    }
  }

  terminate() {
    for (const proc of this.processes) {
      proc.state = 'terminated';
    }
    for (const job of this.childJobs) {
      job.terminate();
    }
    this.processes.clear();
    this.childJobs.clear();
  }
}

export class JobTable {
  constructor() {
    this.jobs = new Map();
    this.nextId = 1;
    this.rootJob = this.createJob(null);
  }

  createJob(parent = this.rootJob, limits = {}) {
    const job = new Job(this.nextId++, parent, limits);
    this.jobs.set(job.id, job);
    if (parent) {
      parent.addJob(job);
    }
    return job;
  }

  getJob(id) {
    return this.jobs.get(id);
  }

  terminateJob(id) {
    const job = this.jobs.get(id);
    if (job) {
      job.terminate();
    }
  }
}

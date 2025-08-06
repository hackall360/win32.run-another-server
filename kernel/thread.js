let nextTid = 1;

export class Thread {
  constructor(entry, scheduler = null) {
    this.tid = nextTid++;
    this.entry = entry;
    this.state = 'ready';
    this.context = { registers: {}, sp: 0 };
    this.scheduler = scheduler;
  }

  saveContext(ctx) {
    this.context = { ...ctx };
  }

  loadContext() {
    return { ...this.context };
  }

  async start(...args) {
    this.state = 'running';
    try {
      return await this.entry(...args);
    } finally {
      this.state = 'terminated';
    }
  }

  wait(object, timeout) {
    if (!this.scheduler) {
      throw new Error('Thread has no scheduler');
    }
    return this.scheduler.blockThread(this, object, timeout);
  }
}

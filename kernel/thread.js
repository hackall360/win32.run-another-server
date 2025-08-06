let nextTid = 1;

export class Thread {
  constructor(entry) {
    this.tid = nextTid++;
    this.entry = entry;
    this.state = 'ready';
    this.context = {};
  }

  async start(...args) {
    this.state = 'running';
    try {
      return await this.entry(...args);
    } finally {
      this.state = 'terminated';
    }
  }
}

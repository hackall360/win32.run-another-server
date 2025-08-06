import Driver from './base.js';

export class StorageDriver extends Driver {
  constructor() {
    super('storage', 'IRQ_STORAGE');
    this.requests = [];
    this.irqCount = 0;
  }

  handleRequest(request) {
    this.requests.push(request);
    return `storage:${request}`;
  }

  handleIRQ(data) {
    this.irqCount++;
    this.lastIRQ = data;
  }
}

export default StorageDriver;

import Driver from './base.js';

export class NetworkDriver extends Driver {
  constructor() {
    super('network', 'IRQ_NETWORK');
    this.requests = [];
    this.irqCount = 0;
  }

  handleRequest(request) {
    this.requests.push(request);
    return `network:${request}`;
  }

  handleIRQ(data) {
    this.irqCount++;
    this.lastIRQ = data;
  }
}

export default NetworkDriver;

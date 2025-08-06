import Driver from './base.js';

export class DisplayDriver extends Driver {
  constructor() {
    super('display', 'IRQ_DISPLAY');
    this.requests = [];
    this.irqCount = 0;
  }

  handleRequest(request) {
    this.requests.push(request);
    return `display:${request}`;
  }

  handleIRQ(data) {
    this.irqCount++;
    this.lastIRQ = data;
  }
}

export default DisplayDriver;

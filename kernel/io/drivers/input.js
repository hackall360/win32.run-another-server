import Driver from './base.js';

export class InputDriver extends Driver {
  constructor() {
    super('input', 'IRQ_INPUT');
    this.requests = [];
    this.irqCount = 0;
  }

  handleRequest(request) {
    this.requests.push(request);
    return `input:${request}`;
  }

  handleIRQ(_ctx, data) {
    this.irqCount++;
    this.lastIRQ = data;
  }
}

export default InputDriver;

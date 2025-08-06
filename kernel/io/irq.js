export class IRQController {
  constructor() {
    this.handlers = new Map();
  }

  register(irq, handler) {
    if (!this.handlers.has(irq)) {
      this.handlers.set(irq, []);
    }
    this.handlers.get(irq).push(handler);
  }

  trigger(irq, ...args) {
    const list = this.handlers.get(irq) || [];
    for (const handler of list) {
      handler(...args);
    }
  }

  clear(irq) {
    this.handlers.delete(irq);
  }
}

export const irqController = new IRQController();
export default irqController;

export class Driver {
  constructor(name, irq) {
    this.name = name;
    this.irq = irq;
  }

  // Handle a generic request for the device
  handleRequest(_request) {
    // To be implemented by subclasses
  }

  // Handle an interrupt request
  handleIRQ(_data) {
    // To be implemented by subclasses
  }
}

export default Driver;

export class Driver {
  constructor(name, irq, version = '0.0.0') {
    this.name = name;
    this.irq = irq;
    this.version = version;
  }

  // Driver entry point
  DriverEntry() {}

  // Cleanup routine invoked on unload
  DriverUnload() {}

  // Handle a generic request for the device
  handleRequest(_request) {
    // To be implemented by subclasses
  }

  // Handle an I/O Request Packet in a stack
  handleIrp(_irp, next) {
    if (typeof next === 'function') return next();
    return 0;
  }

  // Handle an interrupt request
  handleIRQ(_data) {
    // To be implemented by subclasses
  }
}

export default Driver;

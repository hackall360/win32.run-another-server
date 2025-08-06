/**
 * Represents a stack of layered drivers. IRPs traverse the stack
 * from the top driver down to the lowest driver.
 */
export class DriverStack {
  constructor(drivers = []) {
    this.drivers = drivers;
  }

  addDriver(driver) {
    this.drivers.push(driver);
  }

  /**
    * Send an IRP through the stack. Each driver receives the IRP and a
    * callback to invoke the next driver in the chain.
    * @param {IRP} irp
    */
  send(irp) {
    let index = 0;
    const next = () => {
      const driver = this.drivers[index++];
      if (driver && typeof driver.handleIrp === 'function') {
        return driver.handleIrp(irp, next);
      }
      return irp.status;
    };
    return next();
  }
}

export default DriverStack;

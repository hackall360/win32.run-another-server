import { logError } from '../../system/eventLog.js';
import { createCrashDump } from '../../system/crashDump.js';

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
        try {
          return driver.handleIrp(irp, next);
        } catch (err) {
          logError('DriverStack.send', err, { driver: driver.name });
          createCrashDump('driver_irp_failure', { driver: driver.name, irp });
          throw err;
        }
      }
      return irp.status;
    };
    try {
      return next();
    } catch (err) {
      logError('DriverStack.send', err);
      createCrashDump('driver_stack_failure', { irp });
      throw err;
    }
  }
}

export default DriverStack;

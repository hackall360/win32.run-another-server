import { interruptController } from '../../src/lib/hal/index.js';

export class DeviceManager {
  constructor() {
    this.drivers = new Map();
  }

  registerDriver(driver) {
    this.drivers.set(driver.name, driver);
    if (driver.irq) {
      interruptController.register(driver.irq, data => {
        if (typeof driver.handleIRQ === 'function') {
          driver.handleIRQ(data);
        }
      });
    }
  }

  sendRequest(name, request) {
    const driver = this.drivers.get(name);
    if (!driver || typeof driver.handleRequest !== 'function') {
      throw new Error(`No driver registered for ${name}`);
    }
    return driver.handleRequest(request);
  }

  reset() {
    for (const driver of this.drivers.values()) {
      if (driver.irq) {
        interruptController.clear(driver.irq);
      }
    }
    this.drivers.clear();
  }
}

export const deviceManager = new DeviceManager();
export default deviceManager;

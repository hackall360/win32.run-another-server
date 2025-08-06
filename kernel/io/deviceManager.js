import { interruptController, powerManagement } from '../../src/lib/hal/index.js';
import pnpManager from '../pnp/index.js';

export class DeviceManager {
  constructor() {
    this.drivers = new Map();
    this.factories = new Map();
    pnpManager.onHotPlug(event => {
      if (event.type === 'add') {
        this.loadDriverForDevice(event.device);
        powerManagement.setDeviceState(event.device.id, 'on');
      } else if (event.type === 'remove') {
        this.unloadDriver(event.device.id);
        powerManagement.setDeviceState(event.device.id, 'off');
      }
    });
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

  unregisterDriver(name) {
    const driver = this.drivers.get(name);
    if (!driver) return;
    if (driver.irq) {
      interruptController.clear(driver.irq);
    }
    this.drivers.delete(name);
  }

  registerDriverFactory(type, factory) {
    this.factories.set(type, factory);
  }

  loadDriverForDevice(device) {
    const Factory = this.factories.get(device.type);
    if (!Factory) return;
    const driver = new Factory();
    driver.name = device.id;
    this.registerDriver(driver);
  }

  unloadDriver(deviceId) {
    this.unregisterDriver(deviceId);
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
    this.factories.clear();
  }
}

export const deviceManager = new DeviceManager();
export default deviceManager;

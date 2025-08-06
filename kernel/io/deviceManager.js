import { interruptController, powerManagement } from '../../src/lib/hal/index.js';
import pnpManager from '../pnp/index.js';
import { logError } from '../../system/eventLog.js';
import { createCrashDump } from '../../system/crashDump.js';

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
    try {
      const Factory = this.factories.get(device.type);
      if (!Factory) {
        const error = new Error(`No driver factory for ${device.type}`);
        logError('DeviceManager.loadDriverForDevice', error, { device });
        return;
      }
      const driver = new Factory();
      driver.name = device.id;
      this.registerDriver(driver);
    } catch (err) {
      logError('DeviceManager.loadDriverForDevice', err, { device });
      createCrashDump('driver_load_failure', { device });
    }
  }

  unloadDriver(deviceId) {
    this.unregisterDriver(deviceId);
  }

  sendRequest(name, request) {
    const driver = this.drivers.get(name);
    if (!driver || typeof driver.handleRequest !== 'function') {
      const error = new Error(`No driver registered for ${name}`);
      logError('DeviceManager.sendRequest', error, { name });
      createCrashDump('missing_driver', { name, request });
      throw error;
    }
    try {
      return driver.handleRequest(request);
    } catch (err) {
      logError('DeviceManager.sendRequest', err, { name, request });
      createCrashDump('driver_request_failure', { name, request });
      throw err;
    }
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

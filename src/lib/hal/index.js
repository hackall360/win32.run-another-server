// Hardware Abstraction Layer (HAL) simulation
// Provides simple interfaces for kernel modules to interact with
// simulated hardware components.

// Simulated hardware ports storage
const ports = new Map();

export function readPort(port) {
  return ports.get(port) ?? 0;
}

export function writePort(port, value) {
  ports.set(port, value);
}

export const interruptController = (() => {
  const handlers = new Map();
  return {
    register(irq, handler) {
      handlers.set(irq, handler);
    },
    trigger(irq, ...args) {
      const handler = handlers.get(irq);
      if (handler) {
        handler(...args);
      }
    },
    clear(irq) {
      handlers.delete(irq);
    }
  };
})();

export const timer = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: id => clearTimeout(id)
};

export const powerManagement = (() => {
  let systemState = 'on';
  const deviceStates = new Map();
  return {
    shutdown() {
      systemState = 'off';
    },
    reboot() {
      systemState = 'rebooting';
    },
    sleep() {
      systemState = 'sleep';
    },
    hibernate() {
      systemState = 'hibernate';
    },
    getState() {
      return systemState;
    },
    setDeviceState(id, state) {
      deviceStates.set(id, state);
    },
    getDeviceState(id) {
      return deviceStates.get(id) ?? 'on';
    },
    reset() {
      systemState = 'on';
      deviceStates.clear();
    }
  };
})();

export default {
  readPort,
  writePort,
  interruptController,
  timer,
  powerManagement
};

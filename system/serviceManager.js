export class ServiceManager {
  constructor() {
    this.services = new Map();
  }

  register(name, service) {
    this.services.set(name, { service, running: false });
  }

  async start(name, ...args) {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }
    if (entry.running) return;
    if (typeof entry.service.start === 'function') {
      await entry.service.start(...args);
    }
    entry.running = true;
  }

  async stop(name, ...args) {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }
    if (!entry.running) return;
    if (typeof entry.service.stop === 'function') {
      await entry.service.stop(...args);
    }
    entry.running = false;
  }

  isRunning(name) {
    const entry = this.services.get(name);
    return entry ? entry.running : false;
  }
}

export const serviceManager = new ServiceManager();

export class ServiceManager {
  constructor() {
    this.services = new Map();
  }

  register(name, service, options = {}) {
    const {
      deps = [],
      restart = 'never'
    } = options;
    this.services.set(name, {
      service,
      deps,
      restart,
      running: false,
      instance: null,
      handle: null,
      args: [],
      stopping: false
    });
  }

  async start(name, ...args) {
    return this.#startInternal(name, new Set(), ...args);
  }

  async #startInternal(name, visited, ...args) {
    if (visited.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }
    visited.add(name);

    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }

    for (const dep of entry.deps) {
      await this.#startInternal(dep, visited, ...args);
    }

    if (entry.running) return;

    entry.args = args;

    try {
      if (typeof entry.service.start === 'function') {
        const result = entry.service.start(...args);
        // Await resolution to capture rejections; supports sync and async starts
        await Promise.resolve(result);
        entry.instance = result;
        this.#attachRestart(name, entry);
      }
      entry.running = true;
    } catch (err) {
      entry.running = false;
      if (entry.restart === 'always' || entry.restart === 'on-failure') {
        setTimeout(() => {
          // best effort restart; swallow errors to avoid unhandled rejection
          this.start(name, ...entry.args).catch(() => {});
        }, 0);
      }
      throw err;
    }
  }

  async stop(name, ...args) {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }
    if (!entry.running) return;
    entry.stopping = true;
    if (entry.instance && entry.handle && typeof entry.instance.off === 'function') {
      for (const evt of ['exit', 'close', 'error']) {
        entry.instance.off(evt, entry.handle);
      }
    }
    if (typeof entry.service.stop === 'function') {
      await entry.service.stop(...args);
    }
    entry.running = false;
    entry.instance = null;
    entry.handle = null;
    entry.stopping = false;
  }

  isRunning(name) {
    const entry = this.services.get(name);
    return entry ? entry.running : false;
  }

  #attachRestart(name, entry) {
    const source = entry.instance;
    if (!source || typeof source.on !== 'function') return;

    const handler = (err) => {
      if (entry.handle && source.off) {
        for (const evt of ['exit', 'close', 'error']) {
          source.off(evt, entry.handle);
        }
      }
      entry.running = false;
      entry.instance = null;
      if (entry.stopping) return;
      if (entry.restart === 'always' || (entry.restart === 'on-failure' && err)) {
        setTimeout(() => {
          this.start(name, ...entry.args).catch(() => {});
        }, 0);
      }
    };

    entry.handle = handler;
    for (const evt of ['exit', 'close', 'error']) {
      source.on(evt, handler);
    }
  }
}

export const serviceManager = new ServiceManager();

import { PhysicalMemory } from './memory/physicalMemory.js';
import { VirtualMemory } from './memory/virtualMemory.js';
import { Scheduler } from './scheduler.js';
import { Thread } from './thread.js';
import { deviceManager } from './io/deviceManager.js';
import DisplayDriver from './io/drivers/display.js';
import InputDriver from './io/drivers/input.js';
import NetworkDriver from './io/drivers/network.js';
import StorageDriver from './io/drivers/storage.js';
import { serviceManager } from '../system/serviceManager.js';

/**
 * Bootstraps the kernel and core subsystems.
 *
 * @param {Object} [options] Optional boot parameters
 * @param {Object} [options.memory] Memory configuration
 * @param {number} [options.memory.totalPages] Total number of pages
 * @param {number} [options.memory.pageSize] Size of each page in bytes
 * @param {number} [options.memory.kernelHeapPages] Pages reserved for kernel heap
 * @param {Array} [options.drivers] Additional driver instances to register
 * @param {Array} [options.services] Services to register and start
 * @param {Array} [options.kernelModules] Preloaded kernel modules
 * @returns {Promise<Object>} Initialized kernel components
 */
export async function bootstrap(options = {}) {
  const {
    memory = {},
    drivers = [],
    services = [],
    kernelModules = []
  } = options;

  // Initialize memory managers
  const physicalMemory = new PhysicalMemory(
    memory.totalPages,
    memory.pageSize,
    memory.kernelHeapPages
  );
  const virtualMemory = new VirtualMemory(physicalMemory);

  // Load kernel modules (simply collect them for now)
  const modules = new Map();
  for (const mod of kernelModules) {
    if (mod && mod.name) {
      modules.set(mod.name, mod.module ?? mod);
    }
  }

  // Register default and user supplied drivers
  const defaultDrivers = [
    new DisplayDriver(),
    new InputDriver(),
    new NetworkDriver(),
    new StorageDriver()
  ];
  for (const driver of [...defaultDrivers, ...drivers]) {
    deviceManager.registerDriver(driver);
  }

  // Set up the scheduler with an idle thread
  const scheduler = new Scheduler();
  const idleProcess = scheduler.createProcess(-Infinity);
  const idleThread = new Thread(() => {});
  idleProcess.addThread(idleThread);
  scheduler.contextSwitch(idleProcess);

  // Launch initial system services
  for (const { name, service } of services) {
    serviceManager.register(name, service);
  }
  for (const { name } of services) {
    await serviceManager.start(name);
  }

  return {
    physicalMemory,
    virtualMemory,
    scheduler,
    modules,
    deviceManager
  };
}

export default bootstrap;

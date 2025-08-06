export class SyscallDispatcher {
  constructor() {
    this.serviceTable = new Map();
    this.trapHandlers = new Map();
  }

  registerService(number, handler) {
    this.serviceTable.set(number, handler);
  }

  registerTrap(trap, handler) {
    this.trapHandlers.set(trap, handler);
  }

  invoke(number, ...args) {
    const fn = this.serviceTable.get(number);
    if (!fn) {
      throw new Error(`Invalid system call: ${number}`);
    }
    return fn(...args);
  }

  trap(trap, ...args) {
    const handler = this.trapHandlers.get(trap);
    if (!handler) {
      throw new Error(`Unhandled trap: ${trap}`);
    }
    return handler(...args);
  }
}

export const syscall = new SyscallDispatcher();

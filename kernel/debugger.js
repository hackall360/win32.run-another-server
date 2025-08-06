import EventEmitter from 'events';
import readline from 'readline';

export class KernelDebugger extends EventEmitter {
  constructor() {
    super();
    this.breakpoints = new Map();
    this.memorySource = null;
  }

  setBreakpoint(label, handler = () => {}) {
    this.breakpoints.set(label, handler);
  }

  clearBreakpoint(label) {
    this.breakpoints.delete(label);
  }

  hit(label, context = {}) {
    const handler = this.breakpoints.get(label);
    if (handler) {
      handler(context);
    }
    this.emit('breakpoint', { label, context });
  }

  attachMemory(memory) {
    this.memorySource = memory;
  }

  inspectMemory(address, length = 16) {
    if (!this.memorySource || typeof this.memorySource.readByte !== 'function') {
      return [];
    }
    const bytes = [];
    for (let i = 0; i < length; i++) {
      try {
        bytes.push(this.memorySource.readByte(address + i));
      } catch (e) {
        bytes.push(undefined);
      }
    }
    return bytes;
  }

  startConsole(prompt = 'kd> ') {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt });
    rl.prompt();
    rl.on('line', line => {
      const [cmd, ...args] = line.trim().split(/\s+/);
      switch (cmd) {
        case 'break':
          this.setBreakpoint(args[0]);
          console.log(`Breakpoint set at ${args[0]}`);
          break;
        case 'mem':
          const addr = parseInt(args[0]);
          const len = parseInt(args[1] || '16', 10);
          console.log(this.inspectMemory(addr, len));
          break;
        case 'clear':
          this.clearBreakpoint(args[0]);
          break;
        case 'quit':
          rl.close();
          return;
        default:
          console.log('Commands: break <label>, mem <addr> [len], clear <label>, quit');
      }
      rl.prompt();
    });
  }
}

export const kernelDebugger = new KernelDebugger();
export default kernelDebugger;

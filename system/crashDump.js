import { eventLog } from './eventLog.js';

export class CrashDump {
  constructor() {
    this.dumps = [];
  }

  create(reason, context = {}) {
    const dump = {
      timestamp: new Date(),
      reason,
      context
    };
    this.dumps.push(dump);
    eventLog.log('crash', reason, context);
    return dump;
  }

  getDumps() {
    return [...this.dumps];
  }

  clear() {
    this.dumps.length = 0;
  }
}

export const crashDump = new CrashDump();
export const createCrashDump = (reason, context) => crashDump.create(reason, context);
export default crashDump;

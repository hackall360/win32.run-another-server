import process from 'node:process';

export class PerfMon {
  constructor() {
    this.samples = [];
    this.timer = null;
  }

  getHighResolutionTime() {
    return process.hrtime.bigint();
  }

  getCounters() {
    const cpu = process.cpuUsage();
    const memory = process.memoryUsage();
    const usage = process.resourceUsage?.() ?? {};
    const io = {
      read: usage.fsRead ?? 0,
      write: usage.fsWrite ?? 0
    };
    return {
      timestamp: this.getHighResolutionTime(),
      cpu,
      memory,
      io
    };
  }

  startSampling(intervalMs = 1000) {
    if (this.timer) return false;
    this.samples = [];
    this.timer = setInterval(() => {
      this.samples.push(this.getCounters());
    }, intervalMs);
    return true;
  }

  stopSampling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const data = this.samples;
    this.samples = [];
    return data;
  }
}

export const perfmon = new PerfMon();
export default perfmon;

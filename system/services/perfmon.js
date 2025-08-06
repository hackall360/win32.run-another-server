import { PERFMON_SERVICES } from '../../usermode/win32/perfmon.js';
import { perfmon } from '../perfmon.js';

export function getCounters() {
  return perfmon.getCounters();
}

export function startSampling(interval) {
  return perfmon.startSampling(interval);
}

export function stopSampling() {
  return perfmon.stopSampling();
}

export function registerPerfMon(syscall) {
  syscall.registerService(PERFMON_SERVICES.GET_COUNTERS, getCounters);
  syscall.registerService(PERFMON_SERVICES.START_SAMPLING, startSampling);
  syscall.registerService(PERFMON_SERVICES.STOP_SAMPLING, stopSampling);
}

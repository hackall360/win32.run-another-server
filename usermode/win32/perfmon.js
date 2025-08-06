import { syscall } from '../../system/syscall.js';

export const PERFMON_SERVICES = {
  GET_COUNTERS: 0x4000,
  START_SAMPLING: 0x4001,
  STOP_SAMPLING: 0x4002
};

export function GetPerformanceCounters() {
  return syscall.invoke(PERFMON_SERVICES.GET_COUNTERS);
}

export function StartSampling(intervalMs) {
  return syscall.invoke(PERFMON_SERVICES.START_SAMPLING, intervalMs);
}

export function StopSampling() {
  return syscall.invoke(PERFMON_SERVICES.STOP_SAMPLING);
}

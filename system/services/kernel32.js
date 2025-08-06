import { KERNEL32_SERVICES } from '../../usermode/win32/kernel32.js';

let schedulerRef;

export function createProcess(executable, args = []) {
  const proc = schedulerRef.createProcess();
  proc.image = executable;
  proc.args = args;
  return proc.pid;
}

export function exitProcess(code = 0) {
  return code;
}

export function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function allocConsole() {
  return true;
}

export function writeConsole(handle, message) {
  return message.length;
}

export function registerKernel32(syscall, scheduler) {
  schedulerRef = scheduler;
  syscall.registerService(KERNEL32_SERVICES.CREATE_PROCESS, createProcess);
  syscall.registerService(KERNEL32_SERVICES.EXIT_PROCESS, exitProcess);
  syscall.registerService(KERNEL32_SERVICES.SLEEP, sleep);
  syscall.registerService(KERNEL32_SERVICES.ALLOC_CONSOLE, allocConsole);
  syscall.registerService(KERNEL32_SERVICES.WRITE_CONSOLE, writeConsole);
}

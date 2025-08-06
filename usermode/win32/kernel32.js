import { syscall } from '../../system/syscall.js';

export const KERNEL32_SERVICES = {
  CREATE_PROCESS: 0x1000,
  EXIT_PROCESS: 0x1001,
  SLEEP: 0x1002,
  ALLOC_CONSOLE: 0x1003,
  WRITE_CONSOLE: 0x1004,
  CREATE_PIPE: 0x1100,
  CONNECT_LPC_PORT: 0x1101,
  CREATE_MAILSLOT: 0x1102,
  CREATE_SHARED_MEMORY: 0x1103
};

// Basic console handle for userland apps. In a real system this would
// be an object managed by the kernel. Here we simply expose a fixed
// handle and echo to Node's console for demonstration purposes.
const CONSOLE_HANDLE = 1;

export function CreateProcess(executable, args = []) {
  return syscall.invoke(KERNEL32_SERVICES.CREATE_PROCESS, executable, args);
}

export function ExitProcess(code = 0) {
  return syscall.invoke(KERNEL32_SERVICES.EXIT_PROCESS, code);
}

export function Sleep(ms) {
  return syscall.invoke(KERNEL32_SERVICES.SLEEP, ms);
}

export function AllocConsole() {
  syscall.invoke(KERNEL32_SERVICES.ALLOC_CONSOLE);
  return CONSOLE_HANDLE;
}

export function WriteConsole(handle, message) {
  if (handle === CONSOLE_HANDLE) {
    console.log(message);
  }
  return syscall.invoke(KERNEL32_SERVICES.WRITE_CONSOLE, handle, message);
}

export function CreatePipe(name, options) {
  return syscall.invoke(KERNEL32_SERVICES.CREATE_PIPE, name, options);
}

export function ConnectLpcPort(name) {
  return syscall.invoke(KERNEL32_SERVICES.CONNECT_LPC_PORT, name);
}

export function CreateMailslot(name, options) {
  return syscall.invoke(KERNEL32_SERVICES.CREATE_MAILSLOT, name, options);
}

export function CreateSharedMemory(name, size, options) {
  return syscall.invoke(KERNEL32_SERVICES.CREATE_SHARED_MEMORY, name, size, options);
}

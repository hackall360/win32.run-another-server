import { USER32_SERVICES } from '../../usermode/win32/user32.js';

export const windows = new Map();
let nextHwnd = 1;

export function createWindow(params) {
  const hwnd = nextHwnd++;
  windows.set(hwnd, { ...params, visible: false });
  return hwnd;
}

export function showWindow(hwnd, cmd) {
  const win = windows.get(hwnd);
  if (win) {
    win.visible = cmd !== 0;
    return true;
  }
  return false;
}

export function messageBox(hwnd, text, caption, type = 0) {
  return `${caption}: ${text}`;
}

export function dispatchMessage(msg) {
  return msg;
}

export function registerUser32(syscall) {
  syscall.registerService(USER32_SERVICES.CREATE_WINDOW, createWindow);
  syscall.registerService(USER32_SERVICES.SHOW_WINDOW, showWindow);
  syscall.registerService(USER32_SERVICES.MESSAGE_BOX, messageBox);
  syscall.registerService(USER32_SERVICES.DISPATCH_MESSAGE, dispatchMessage);
}

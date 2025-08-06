import { syscall } from '../../system/syscall.js';

export const USER32_SERVICES = {
  CREATE_WINDOW: 0x2000,
  SHOW_WINDOW: 0x2001,
  MESSAGE_BOX: 0x2002,
  DISPATCH_MESSAGE: 0x2003
};

// A tiny message queue to emulate the cooperative message loop used by
// Win32 applications. Applications can post messages which are later
// retrieved with GetMessage.
const messageQueue = [];

export function CreateWindow(className, windowName, x, y, width, height, opts = {}) {
  return syscall.invoke(
    USER32_SERVICES.CREATE_WINDOW,
    { className, windowName, x, y, width, height, opts }
  );
}

export function ShowWindow(hwnd, cmd) {
  return syscall.invoke(USER32_SERVICES.SHOW_WINDOW, hwnd, cmd);
}

export function MessageBox(hwnd, text, caption, type = 0) {
  return syscall.invoke(USER32_SERVICES.MESSAGE_BOX, hwnd, text, caption, type);
}

export function DispatchMessage(msg) {
  return syscall.invoke(USER32_SERVICES.DISPATCH_MESSAGE, msg);
}

export function PostMessage(msg) {
  messageQueue.push(msg);
}

export function GetMessage() {
  return messageQueue.shift() ?? null;
}

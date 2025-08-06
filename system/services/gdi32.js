import { GDI32_SERVICES } from '../../usermode/win32/gdi32.js';

export const textOutputs = [];

export function createDC(hdc = 0) {
  return 1;
}

export function deleteDC(hdc) {
  return true;
}

export function textOut(hdc, x, y, text) {
  textOutputs.push({ hdc, x, y, text });
  return text.length;
}

export function registerGdi32(syscall) {
  syscall.registerService(GDI32_SERVICES.CREATE_DC, createDC);
  syscall.registerService(GDI32_SERVICES.DELETE_DC, deleteDC);
  syscall.registerService(GDI32_SERVICES.TEXT_OUT, textOut);
}

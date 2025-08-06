import { syscall } from '../../system/syscall.js';

export const GDI32_SERVICES = {
  CREATE_DC: 0x3000,
  DELETE_DC: 0x3001,
  TEXT_OUT: 0x3002
};

export function CreateCompatibleDC(hdc = 0) {
  return syscall.invoke(GDI32_SERVICES.CREATE_DC, hdc);
}

export function DeleteDC(hdc) {
  return syscall.invoke(GDI32_SERVICES.DELETE_DC, hdc);
}

export function TextOut(hdc, x, y, text) {
  return syscall.invoke(GDI32_SERVICES.TEXT_OUT, hdc, x, y, text);
}

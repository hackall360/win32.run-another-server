import { syscall } from '../../system/syscall.js';

export const WINMM_SERVICES = {
  PLAY_TONE: 0x3000,
  PLAY_BUFFER: 0x3001
};

export function PlayTone(freq, duration) {
  return syscall.invoke(WINMM_SERVICES.PLAY_TONE, freq, duration);
}

export function PlayBuffer(buffer) {
  return syscall.invoke(WINMM_SERVICES.PLAY_BUFFER, buffer);
}

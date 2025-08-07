import { WINMM_SERVICES } from '../../usermode/win32/winmm.js';
import deviceManager from '../../kernel/io/deviceManager.js';

export function playTone(freq, duration) {
  return deviceManager.sendRequest('audio', { type: 'tone', freq, duration });
}

export function playBuffer(buffer) {
  return deviceManager.sendRequest('audio', { type: 'buffer', buffer });
}

export function registerWinmm(syscall) {
  syscall.registerService(WINMM_SERVICES.PLAY_TONE, playTone);
  syscall.registerService(WINMM_SERVICES.PLAY_BUFFER, playBuffer);
}

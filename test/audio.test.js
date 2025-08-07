import { test } from 'node:test';
import assert from 'node:assert';
import deviceManager from '../kernel/io/deviceManager.js';
import AudioDriver from '../kernel/io/drivers/audio.js';
import { PlayTone, PlayBuffer } from '../usermode/win32/winmm.js';
import { registerWinmm } from '../system/services/winmm.js';
import { syscall } from '../system/syscall.js';

function setup() {
  deviceManager.reset();
  const audio = new AudioDriver();
  deviceManager.registerDriver(audio);
  registerWinmm(syscall);
  return audio;
}

test('audio driver plays tone via winmm wrapper', () => {
  const audio = setup();
  assert.strictEqual(PlayTone(440, 1000), 'audio:tone:440:1000');
  assert.deepStrictEqual(audio.requests[0], { type: 'tone', freq: 440, duration: 1000 });
});

test('audio driver plays buffer via winmm wrapper', () => {
  const audio = setup();
  const buffer = new Uint8Array([1, 2, 3]);
  assert.strictEqual(PlayBuffer(buffer), 'audio:buffer:3');
  assert.deepStrictEqual(audio.requests[0], { type: 'buffer', buffer });
});

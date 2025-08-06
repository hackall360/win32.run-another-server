import { test } from 'node:test';
import assert from 'node:assert';
import { readPort, writePort, interruptController, timer, powerManagement } from '../src/lib/hal/index.js';

test('readPort and writePort operate on simulated ports', () => {
  writePort(0x10, 123);
  assert.strictEqual(readPort(0x10), 123);
});

test('interruptController registers and triggers handlers', () => {
  let called = false;
  interruptController.register('IRQ1', () => { called = true; });
  interruptController.trigger('IRQ1');
  assert.ok(called);
  interruptController.clear('IRQ1');
});

test('timer.setTimeout executes callback', async () => {
  let fired = false;
  const id = timer.setTimeout(() => { fired = true; }, 10);
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(fired);
  timer.clearTimeout(id);
});

test('powerManagement tracks power state', () => {
  powerManagement.shutdown();
  assert.strictEqual(powerManagement.getState(), 'off');
  powerManagement.reboot();
  assert.strictEqual(powerManagement.getState(), 'rebooting');
});

test('powerManagement handles sleep and hibernate', () => {
  powerManagement.sleep();
  assert.strictEqual(powerManagement.getState(), 'sleep');
  powerManagement.hibernate();
  assert.strictEqual(powerManagement.getState(), 'hibernate');
});

test('powerManagement tracks per-device states', () => {
  powerManagement.setDeviceState('dev1', 'off');
  assert.strictEqual(powerManagement.getDeviceState('dev1'), 'off');
  powerManagement.reset();
});

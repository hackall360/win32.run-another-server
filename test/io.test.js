import { test } from 'node:test';
import assert from 'node:assert';
import deviceManager from '../kernel/io/deviceManager.js';
import { interruptController } from '../kernel/io/index.js';
import StorageDriver from '../kernel/io/drivers/storage.js';
import NetworkDriver from '../kernel/io/drivers/network.js';
import DisplayDriver from '../kernel/io/drivers/display.js';
import InputDriver from '../kernel/io/drivers/input.js';

function setup() {
  deviceManager.reset();
}

test('device manager dispatches requests to appropriate drivers', () => {
  setup();
  const storage = new StorageDriver();
  const network = new NetworkDriver();
  const display = new DisplayDriver();
  const input = new InputDriver();
  deviceManager.registerDriver(storage);
  deviceManager.registerDriver(network);
  deviceManager.registerDriver(display);
  deviceManager.registerDriver(input);
  assert.strictEqual(deviceManager.sendRequest('storage', 'read'), 'storage:read');
  assert.strictEqual(deviceManager.sendRequest('network', 'send'), 'network:send');
  assert.strictEqual(deviceManager.sendRequest('display', 'render'), 'display:render');
  assert.strictEqual(deviceManager.sendRequest('input', 'poll'), 'input:poll');
});


test('irq triggers driver handlers', () => {
  setup();
  const network = new NetworkDriver();
  deviceManager.registerDriver(network);
  interruptController.trigger('IRQ_NETWORK', 'packet');
  assert.strictEqual(network.irqCount, 1);
  assert.strictEqual(network.lastIRQ, 'packet');
});

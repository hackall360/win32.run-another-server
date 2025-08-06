import { test } from 'node:test';
import assert from 'node:assert';
import deviceManager from '../kernel/io/deviceManager.js';
import pnpManager from '../kernel/pnp/index.js';
import NetworkDriver from '../kernel/io/drivers/network.js';
import StorageDriver from '../kernel/io/drivers/storage.js';

function setup() {
  deviceManager.reset();
  pnpManager.reset();
}

test('deviceManager loads and unloads drivers on device events', () => {
  setup();
  deviceManager.registerDriverFactory('network', NetworkDriver);
  pnpManager.addDevice({ id: 'net0', type: 'network' });
  assert.strictEqual(deviceManager.sendRequest('net0', 'send'), 'network:send');
  pnpManager.removeDevice('net0');
  assert.throws(() => deviceManager.sendRequest('net0', 'send'));
});

test('pnp manager enumerates devices and allocates resources', () => {
  setup();
  deviceManager.registerDriverFactory('storage', StorageDriver);
  pnpManager.addDevice({ id: 'disk1', type: 'storage' });
  const devices = pnpManager.enumerate();
  assert.strictEqual(devices.length, 1);
  assert.strictEqual(devices[0].id, 'disk1');
  assert.ok(devices[0].resourceId);
});

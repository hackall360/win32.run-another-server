import { test } from 'node:test';
import assert from 'node:assert';
import { ServiceManager } from '../system/serviceManager.js';

test('service manager starts and stops services', async () => {
  const manager = new ServiceManager();
  const events = [];
  manager.register('demo', {
    start: () => events.push('start'),
    stop: () => events.push('stop')
  });
  await manager.start('demo');
  assert.strictEqual(manager.isRunning('demo'), true);
  await manager.stop('demo');
  assert.deepStrictEqual(events, ['start', 'stop']);
  assert.strictEqual(manager.isRunning('demo'), false);
});

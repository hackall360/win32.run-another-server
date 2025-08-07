import { test } from 'node:test';
import assert from 'node:assert';
import { ServiceManager } from '../system/serviceManager.js';
import { EventEmitter } from 'node:events';

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

test('service manager starts dependencies in order', async () => {
  const manager = new ServiceManager();
  const events = [];
  manager.register('c', { start: () => events.push('c') });
  manager.register('b', { start: () => events.push('b') }, { deps: ['c'] });
  manager.register('a', { start: () => events.push('a') }, { deps: ['b'] });
  await manager.start('a');
  assert.deepStrictEqual(events, ['c', 'b', 'a']);
});

test('service manager prevents dependency cycles', async () => {
  const manager = new ServiceManager();
  manager.register('x', { start() {} }, { deps: ['y'] });
  manager.register('y', { start() {} }, { deps: ['x'] });
  await assert.rejects(() => manager.start('x'), /Circular dependency/);
});

test('restarts on start failure with on-failure policy', async () => {
  const manager = new ServiceManager();
  let attempts = 0;
  manager.register('svc', {
    async start() {
      attempts++;
      if (attempts === 1) {
        throw new Error('fail');
      }
    }
  }, { restart: 'on-failure' });

  await assert.rejects(manager.start('svc'));
  await new Promise(r => setTimeout(r, 10));
  assert.strictEqual(manager.isRunning('svc'), true);
});

test('restarts when service stops unexpectedly with always policy', async () => {
  const manager = new ServiceManager();
  let starts = 0;
  class Svc extends EventEmitter {
    start() {
      starts++;
      return this;
    }
    stop() {
      this.emit('exit');
    }
  }
  const svc = new Svc();
  manager.register('svc', svc, { restart: 'always' });
  await manager.start('svc');
  assert.strictEqual(starts, 1);
  svc.emit('exit');
  await new Promise(r => setTimeout(r, 10));
  assert.strictEqual(starts, 2);
});

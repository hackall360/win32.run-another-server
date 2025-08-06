import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { Registry } from '../system/registry.js';

test('registry provides CRUD operations', () => {
  const reg = new Registry();
  reg.create('foo', 'bar');
  assert.strictEqual(reg.read('foo'), 'bar');
  reg.update('foo', 'baz');
  assert.strictEqual(reg.read('foo'), 'baz');
  reg.delete('foo');
  assert.strictEqual(reg.read('foo'), undefined);
});

test('registry supports hierarchical keys and persistence', () => {
  const reg = new Registry();
  reg.create('foo/bar', 'baz');
  assert.strictEqual(reg.read('foo/bar'), 'baz');

  const tmp = './hive.json';
  reg.saveToFile(tmp);

  const reg2 = new Registry();
  reg2.loadFromFile(tmp);
  assert.strictEqual(reg2.read('foo/bar'), 'baz');

  fs.unlinkSync(tmp);
});

test('registry enforces ACL and emits notifications', () => {
  const reg = new Registry();
  reg.create('secret', 'shh');
  reg.setACL('secret', {
    alice: { read: true, write: true },
    bob: { read: false, write: false },
  });

  assert.strictEqual(reg.read('secret', 'alice'), 'shh');
  assert.throws(() => reg.read('secret', 'bob'), /Access denied/);

  let notified = false;
  reg.on('update', (k, v) => {
    if (k === 'secret' && v === 'open') notified = true;
  });

  reg.update('secret', 'open', 'alice');
  assert.strictEqual(notified, true);
  assert.throws(() => reg.update('secret', 'fail', 'bob'), /Access denied/);
});

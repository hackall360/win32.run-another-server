import { test } from 'node:test';
import assert from 'node:assert';
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

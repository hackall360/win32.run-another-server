import { test } from 'node:test';
import assert from 'node:assert';
import { includes } from '../src/lib/utils.js';

test('includes handles primitive values', () => {
  assert.strictEqual(includes(2, [1, 2, 3]), true);
  assert.strictEqual(includes(NaN, [NaN]), true);
  assert.strictEqual(includes(4, [1, 2, 3]), false);
});

test('includes works with objects without equals method', () => {
  const obj = { a: 1 };
  const arr = [obj];
  assert.strictEqual(includes(obj, arr), true);
  assert.strictEqual(includes({ a: 1 }, arr), false);
});

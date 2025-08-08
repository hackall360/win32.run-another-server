import { test } from 'node:test';
import assert from 'node:assert';
import { includes, compile_params } from '../src/lib/utils.js';

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

test('compile_params merges params and encodes spaces', () => {
  global.window = { location: { search: '?existing=1' } };
  const result = compile_params({ 'new param': 'hello world' });
  assert.strictEqual(result, 'existing=1&new%20param=hello%20world');
  delete global.window;
});

test('compile_params encodes special characters', () => {
  global.window = { location: { search: '' } };
  const result = compile_params({ 'na&me': 'v=1&b' });
  assert.strictEqual(result, 'na%26me=v%3D1%26b');
  delete global.window;
});

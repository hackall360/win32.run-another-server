import { test } from 'node:test';
import assert from 'node:assert';
import { queueProgram, setQueueProgram, theme, setTheme } from '../src/lib/store.js';

test('queueProgram defaults to empty object', () => {
  assert.deepStrictEqual(queueProgram(), {});
});

test('queueProgram can be updated', () => {
  setQueueProgram({ id: 1 });
  assert.deepStrictEqual(queueProgram(), { id: 1 });
});

test('theme defaults to lunaBlue', () => {
  assert.strictEqual(theme(), 'lunaBlue');
});

test('theme can be updated', () => {
  setTheme('lunaOlive');
  assert.strictEqual(theme(), 'lunaOlive');
});

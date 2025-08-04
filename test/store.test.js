import { test } from 'node:test';
import assert from 'node:assert';
import { queueProgram, setQueueProgram } from '../src/lib/store.js';

test('queueProgram defaults to empty object', () => {
  assert.deepStrictEqual(queueProgram(), {});
});

test('queueProgram can be updated', () => {
  setQueueProgram({ id: 1 });
  assert.deepStrictEqual(queueProgram(), { id: 1 });
});

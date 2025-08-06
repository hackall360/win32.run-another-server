import { test } from 'node:test';
import assert from 'node:assert';
import { ProcessTable } from '../kernel/process.js';
import { createToken } from '../kernel/executive/security.js';

test('process creation requires privilege', () => {
  const table = new ProcessTable();
  const user = createToken('user');
  assert.throws(() => table.createProcess(0, user));
  const admin = createToken('system', [], ['createProcess']);
  const proc = table.createProcess(0, admin);
  assert.strictEqual(proc.pid, 1);
});

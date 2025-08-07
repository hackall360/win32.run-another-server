import { test } from 'node:test';
import assert from 'node:assert';
import { ProcessTable } from '../kernel/process.js';
import { createToken } from '../kernel/executive/security.js';
import { addUser, logonUser } from '../kernel/executive/security/users.js';

test('process creation requires logged-on token with privilege', () => {
  const table = new ProcessTable();
  const raw = createToken('user', [], ['createProcess']);
  assert.throws(() => table.createProcess(0, raw));
  addUser('alice', 'pw');
  const token = logonUser('alice', 'pw');
  token.addPrivilege('createProcess');
  const proc = table.createProcess(0, token);
  assert.strictEqual(proc.pid, 1);
});

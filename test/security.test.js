import { test } from 'node:test';
import assert from 'node:assert';
import { addUser, logonUser } from '../kernel/executive/security/users.js';
import { checkAccess } from '../kernel/executive/security.js';
import { ProcessTable } from '../kernel/process.js';

test('logonUser authenticates credentials', () => {
  addUser('bob', 'secret');
  assert.ok(logonUser('bob', 'secret'));
  assert.strictEqual(logonUser('bob', 'wrong'), null);
});

test('impersonation affects privileges', () => {
  addUser('admin', 'pass');
  const admin = logonUser('admin', 'pass');
  admin.addPrivilege('createProcess');

  addUser('guest', 'guest');
  const guest = logonUser('guest', 'guest');

  const table = new ProcessTable();
  table.createProcess(0, admin);

  admin.impersonate(guest);
  assert.throws(() => table.createProcess(0, admin));
  admin.revertToSelf();
  const proc = table.createProcess(0, admin);
  assert.strictEqual(proc.pid, 2);
});

test('ACL enforces group access', () => {
  const group = 'editors';
  addUser('carol', 'pw', [group]);
  const carol = logonUser('carol', 'pw');
  const entry = {
    rights: new Set(['read']),
    acl: new Map([[group, new Set(['write'])]])
  };
  assert.ok(checkAccess(carol, entry, ['write']));

  addUser('dave', 'pw');
  const dave = logonUser('dave', 'pw');
  assert.ok(!checkAccess(dave, entry, ['write']));
  assert.ok(checkAccess(dave, entry, ['read']));
});

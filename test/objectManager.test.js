import { test } from 'node:test';
import assert from 'node:assert';
import { ObjectManager } from '../kernel/executive/objectManager.js';
import { createToken } from '../kernel/executive/security.js';

// Test handle allocation and reference counting

test('object manager allocates handles and tracks references', () => {
  const om = new ObjectManager();
  om.registerObject('\\obj', {});
  const handle = om.openHandle('\\obj');
  assert.strictEqual(typeof handle, 'number');
  assert.strictEqual(om.queryObject('\\obj').refCount, 1);
  om.closeHandle(handle);
  assert.strictEqual(om.queryObject('\\obj').refCount, 0);
});

// Test rights and ACL enforcement

test('object manager enforces rights and ACL', () => {
  const om = new ObjectManager();
  om.registerObject('\\secret', {}, { acl: { user: ['read'], admin: ['write'] } });
  const user = createToken('user');
  assert.throws(() => om.openHandle('\\secret', ['write'], user));
  const handle = om.openHandle('\\secret', ['read'], user);
  assert.ok(handle);
});

test('token impersonation adjusts permissions', () => {
  const om = new ObjectManager();
  om.registerObject('\\topsecret', {}, { rights: [], acl: { admin: ['write'] } });
  const user = createToken('user');
  const admin = createToken('admin');
  assert.throws(() => om.openHandle('\\topsecret', ['write'], user));
  user.impersonate(admin);
  const handle = om.openHandle('\\topsecret', ['write'], user);
  assert.ok(handle);
});

// Test namespaces

test('object manager supports namespaces', () => {
  const om = new ObjectManager();
  om.registerObject('\\dir\\obj', {});
  const handle = om.openHandle('\\dir\\obj');
  assert.ok(handle);
  const info = om.queryObject('\\dir\\obj');
  assert.strictEqual(info.refCount, 1);
});

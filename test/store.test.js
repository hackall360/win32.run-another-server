import { test } from 'node:test';
import assert from 'node:assert';
import {
  queueProgram,
  setQueueProgram,
  theme,
  setTheme,
  screensaver,
  setScreensaver,
  screensaverTimeout,
  setScreensaverTimeout,
  loadUsers,
  users,
  currentUser,
  setUsers,
  setCurrentUser,
  resetSystem,
} from '../src/lib/store.js';

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

test('screensaver defaults to null', () => {
  assert.strictEqual(screensaver(), null);
});

test('screensaver can be updated', () => {
  setScreensaver('/html/visualizers/1.html');
  assert.strictEqual(screensaver(), '/html/visualizers/1.html');
});

test('screensaverTimeout defaults to 5', () => {
  assert.strictEqual(screensaverTimeout(), 5);
});

test('screensaverTimeout can be updated', () => {
  setScreensaverTimeout(10);
  assert.strictEqual(screensaverTimeout(), 10);
});

test('loadUsers provides a default user when IndexedDB is unavailable', async () => {
  // Reset state
  setUsers([]);
  setCurrentUser(null);

  await loadUsers();

  const expected = { id: 1, name: 'User', password: '', avatar: '/images/xp/icons/UserAccounts.png' };
  assert.deepStrictEqual(users(), [expected]);
  assert.deepStrictEqual(currentUser(), expected);
});

test('resetSystem clears localStorage', async () => {
  global.localStorage = {
    store: { foo: 'bar' },
    getItem(key) { return this.store[key] ?? null; },
    setItem(key, value) { this.store[key] = String(value); },
    clear() { this.store = {}; }
  };

  await resetSystem();
  assert.deepStrictEqual(global.localStorage.store, {});
});

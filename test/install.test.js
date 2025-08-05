import { test } from 'node:test';
import assert from 'node:assert';
import { is_windows_installed, set_windows_installed } from '../src/lib/utils.js';

test('installation flag stored in localStorage', () => {
  global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] ?? null; },
    setItem(key, value) { this.store[key] = String(value); }
  };

  assert.strictEqual(is_windows_installed(), false);
  set_windows_installed(true);
  assert.strictEqual(is_windows_installed(), true);
});

import { test } from 'node:test';
import assert from 'node:assert';
import kernel from '../src/lib/kernel.js';
import { installedPrograms, setInstalledPrograms, queueProgram, setQueueProgram } from '../src/lib/store.js';

test('kernel installs programs', () => {
  setInstalledPrograms([]);
  kernel.installProgram({ id: 'demo', name: 'Demo', path: './programs/demo.jsx' });
  assert.strictEqual(installedPrograms().length, 1);
});

test('kernel launches installed program', () => {
  setInstalledPrograms([]);
  setQueueProgram({});
  kernel.installProgram({ id: 'demo', name: 'Demo', path: './programs/demo.jsx' });
  kernel.launchProgram('demo');
  assert.deepStrictEqual(queueProgram(), { path: './programs/demo.jsx', fs_item: {} });
});

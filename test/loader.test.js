import { test } from 'node:test';
import assert from 'node:assert';
import loader from '../kernel/loader/index.js';

function createMinimalPE() {
  const buffer = new ArrayBuffer(256);
  const view = new DataView(buffer);
  view.setUint16(0, 0x4d5a, false); // 'MZ'
  view.setUint32(0x3c, 0x80, true); // e_lfanew
  view.setUint32(0x80, 0x50450000, false); // 'PE\0\0'
  view.setUint16(0x84, 0x014c, true); // machine
  view.setUint16(0x86, 0, true); // number of sections
  view.setUint16(0x94, 0xe0, true); // optional header size
  const opt = 0x80 + 24;
  view.setUint32(opt + 16, 0x1000, true); // AddressOfEntryPoint
  return buffer;
}

test('loader parses PE modules and handles entry/unload', () => {
  const buffer = createMinimalPE();
  let entryCalled = false;
  let unloadCalled = false;
  loader.load('test', buffer, {
    version: '1.2.3',
    entry: mod => {
      entryCalled = true;
      assert.strictEqual(mod.version, '1.2.3');
    },
    unload: () => {
      unloadCalled = true;
    }
  });
  const mod = loader.get('test');
  assert.ok(mod);
  assert.strictEqual(mod.headers.entryPoint, 0x1000);
  assert.ok(entryCalled);
  loader.unload('test');
  assert.ok(unloadCalled);
  assert.strictEqual(loader.get('test'), undefined);
});

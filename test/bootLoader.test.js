import { test } from 'node:test';
import assert from 'node:assert';
import { NTFSFileSystem } from '../kernel/executive/fs/ntfs.js';
import { load as bootLoad } from '../boot/loader.js';

async function setupFS(files) {
  const fs = new NTFSFileSystem();
  fs.mount();
  fs.mkdir('/boot');
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/').slice(1, -1);
    let current = '';
    for (const part of parts) {
      current += '/' + part;
      try { fs.mkdir(current); } catch {}
    }
    fs.writeFile(path, content);
  }
  return fs;
}

test('boot loader loads modules with dependencies', async () => {
  const fs = await setupFS({
    '/boot/boot.json': JSON.stringify({
      modules: [
        { name: 'base', path: '/base.js' },
        { name: 'extra', path: '/extra.js', deps: ['base'] }
      ]
    }),
    '/base.js': 'export default { name: "base" };',
    '/extra.js': 'export default { name: "extra" };'
  });
  const kernel = await bootLoad({ fs });
  assert.ok(kernel.modules.has('base'));
  assert.ok(kernel.modules.has('extra'));
  kernel.scheduler.stop();
});

test('boot loader safe mode only loads safe modules', async () => {
  const fs = await setupFS({
    '/boot/boot.json': JSON.stringify({
      modules: [
        { name: 'core', path: '/core.js', safe: true },
        { name: 'unsafe', path: '/unsafe.js', safe: false }
      ]
    }),
    '/core.js': 'export default { name: "core" };',
    '/unsafe.js': 'export default { name: "unsafe" };'
  });
  const kernel = await bootLoad({ fs, safeMode: true });
  assert.ok(kernel.modules.has('core'));
  assert.ok(!kernel.modules.has('unsafe'));
  kernel.scheduler.stop();
});

test('boot loader uses recovery modules on failure', async () => {
  const fs = await setupFS({
    '/boot/boot.json': JSON.stringify({
      modules: [ { name: 'missing', path: '/missing.js' } ],
      recovery: { modules: [ { name: 'recover', path: '/recover.js' } ] }
    }),
    '/recover.js': 'export default { name: "recover" };'
  });
  const kernel = await bootLoad({ fs });
  assert.ok(kernel.modules.has('recover'));
  kernel.scheduler.stop();
});

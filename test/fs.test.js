import { test } from 'node:test';
import assert from 'node:assert';
import { FATFileSystem } from '../kernel/executive/fs/fat.js';
import { NTFSFileSystem } from '../kernel/executive/fs/ntfs.js';
import { cacheManager } from '../kernel/executive/fs/cacheManager.js';

function exercise(fs) {
  fs.mount();
  fs.mkdir('/dir');
  fs.mkdir('/dir/sub');
  fs.writeFile('\\DIR\\SUB\\..\\SUB\\foo.txt', Buffer.from('hello'));
  assert.strictEqual(fs.readFile('/dir/sub/foo.txt').toString(), 'hello');
  const meta = fs.getMetadata('/dir/sub/foo.txt');
  assert.strictEqual(meta.size, 5);
  assert.deepStrictEqual(fs.listDir('/dir').map(n => n.toLowerCase()), ['sub']);
  assert.deepStrictEqual(fs.listDir('/dir/sub').map(n => n.toLowerCase()), ['foo.txt']);
  fs.remove('/dir/sub/foo.txt');
  assert.deepStrictEqual(fs.listDir('/dir/sub'), []);
}

test('FAT and NTFS basic operations with directories', () => {
  exercise(new FATFileSystem());
  exercise(new NTFSFileSystem());
});

test('cache manager buffers file reads', () => {
  const fs = new FATFileSystem();
  fs.mount();
  fs.writeFile('/cache.txt', Buffer.from('cached'));
  const key = fs._normalizePath('/cache.txt');
  // Change underlying storage without invalidating cache
  fs._getFile(key).data = Buffer.from('modified');
  // Should return cached data
  assert.strictEqual(fs.readFile('/cache.txt').toString(), 'cached');
  // After invalidation, should reflect modified data
  cacheManager.invalidate(fs, key);
  assert.strictEqual(fs.readFile('/cache.txt').toString(), 'modified');
});

test('concurrent handles maintain reference counts', () => {
  const fs = new NTFSFileSystem();
  fs.mount();
  fs.writeFile('/handle.txt', Buffer.from('orig'));
  const h1 = fs.open('/handle.txt');
  const h2 = fs.open('/handle.txt');
  fs.write(h1, Buffer.from('data'));
  assert.strictEqual(fs.read(h2).toString(), 'data');
  assert.throws(() => fs.remove('/handle.txt'));
  fs.close(h1);
  assert.throws(() => fs.remove('/handle.txt'));
  fs.close(h2);
  fs.remove('/handle.txt');
  assert.deepStrictEqual(fs.listDir('/'), []);
});

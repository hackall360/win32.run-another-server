import { test } from 'node:test';
import assert from 'node:assert';
import { FATFileSystem } from '../kernel/executive/fs/fat.js';
import { NTFSFileSystem } from '../kernel/executive/fs/ntfs.js';
import { cacheManager } from '../kernel/executive/fs/cacheManager.js';

function exercise(fs) {
  fs.mount();
  fs.writeFile('/foo.txt', Buffer.from('hello'));
  assert.strictEqual(fs.readFile('/foo.txt').toString(), 'hello');
  const meta = fs.getMetadata('/foo.txt');
  assert.strictEqual(meta.size, 5);
}

test('FAT and NTFS basic operations', () => {
  exercise(new FATFileSystem());
  exercise(new NTFSFileSystem());
});

test('cache manager buffers file reads', () => {
  const fs = new FATFileSystem();
  fs.mount();
  fs.writeFile('/cache.txt', Buffer.from('cached'));
  // Change underlying storage without invalidating cache
  const key = fs._normalizePath('/cache.txt');
  fs.files.get(key).data = Buffer.from('modified');
  // Should return cached data
  assert.strictEqual(fs.readFile('/cache.txt').toString(), 'cached');
  // After invalidation, should reflect modified data
  cacheManager.invalidate(fs, '/cache.txt');
  assert.strictEqual(fs.readFile('/cache.txt').toString(), 'modified');
});

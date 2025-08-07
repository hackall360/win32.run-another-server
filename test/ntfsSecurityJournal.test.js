import { test } from 'node:test';
import assert from 'node:assert';
import { NTFSFileSystem } from '../kernel/executive/fs/ntfs.js';
import { createToken, systemToken } from '../kernel/executive/security.js';

test('NTFS enforces DACL on open/write', () => {
  const fs = new NTFSFileSystem();
  fs.mount();
  fs.writeFile('/secret.txt', Buffer.from('top'), { token: systemToken });
  const user = createToken('user1');
  assert.throws(() => fs.open('/secret.txt', { token: user, mode: 'w' }));
  assert.throws(() => fs.writeFile('/secret.txt', Buffer.from('hack'), { token: user }));
  const h = fs.open('/secret.txt', { token: user, mode: 'r' });
  assert.strictEqual(fs.read(h).toString(), 'top');
  fs.close(h);
});

test('NTFS replays journal on mount', () => {
  const fs = new NTFSFileSystem();
  fs.mount();
  const entry = { op: 'writeFile', path: fs._normalizePath('/crash.txt'), data: Buffer.from('oops').toString('base64') };
  fs._log(entry); // simulate pending journal not committed
  fs.unmount();
  fs.mount(); // should replay journal
  assert.strictEqual(fs.readFile('/crash.txt').toString(), 'oops');
});

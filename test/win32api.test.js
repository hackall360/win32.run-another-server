import { test } from 'node:test';
import assert from 'node:assert';
import * as kernel32 from '../usermode/win32/kernel32.js';
import * as user32 from '../usermode/win32/user32.js';
import * as gdi32 from '../usermode/win32/gdi32.js';
import { syscall } from '../system/syscall.js';

test('kernel32 WriteConsole maps to syscall', () => {
  let invoked = false;
  syscall.registerService(kernel32.KERNEL32_SERVICES.WRITE_CONSOLE, (handle, msg) => {
    invoked = true;
    return msg.length;
  });
  const len = kernel32.WriteConsole(1, 'hi');
  assert.strictEqual(len, 2);
  assert.ok(invoked);
});

test('kernel32 AllocConsole returns handle', () => {
  syscall.registerService(kernel32.KERNEL32_SERVICES.ALLOC_CONSOLE, () => true);
  assert.strictEqual(kernel32.AllocConsole(), 1);
});

test('user32 MessageBox maps to syscall', () => {
  syscall.registerService(user32.USER32_SERVICES.MESSAGE_BOX, (hwnd, text, caption, type) => `${caption}: ${text}`);
  assert.strictEqual(user32.MessageBox(null, 'hello', 'title'), 'title: hello');
});

test('user32 message queue stores and retrieves', () => {
  user32.PostMessage({ type: 'ping' });
  assert.deepStrictEqual(user32.GetMessage(), { type: 'ping' });
});

test('gdi32 TextOut maps to syscall', () => {
  syscall.registerService(gdi32.GDI32_SERVICES.TEXT_OUT, (dc, x, y, text) => `${text}@${x},${y}`);
  assert.strictEqual(gdi32.TextOut(1, 10, 20, 'draw'), 'draw@10,20');
});

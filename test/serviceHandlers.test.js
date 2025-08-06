import { test } from 'node:test';
import assert from 'node:assert';
import bootstrap from '../kernel/bootstrap.js';
import * as k32 from '../usermode/win32/kernel32.js';
import * as u32 from '../usermode/win32/user32.js';
import * as g32 from '../usermode/win32/gdi32.js';
import { windows } from '../system/services/user32.js';
import { textOutputs } from '../system/services/gdi32.js';

 test('CreateProcess via kernel32 triggers scheduler', async () => {
  const { scheduler } = await bootstrap();
  const pid = k32.CreateProcess('app.exe');
  const proc = scheduler.table.getProcess(pid);
  assert.ok(proc);
  assert.strictEqual(proc.image, 'app.exe');
  scheduler.stop();
});

test('CreateWindow via user32 stores window', async () => {
  windows.clear();
  const { scheduler } = await bootstrap();
  const hwnd = u32.CreateWindow('cls', 'win', 0, 0, 100, 100);
  assert.ok(windows.has(hwnd));
  scheduler.stop();
});

test('GDI TextOut records output', async () => {
  textOutputs.length = 0;
  const { scheduler } = await bootstrap();
  g32.TextOut(1, 5, 6, 'hello');
  assert.deepStrictEqual(textOutputs.pop(), { hdc: 1, x: 5, y: 6, text: 'hello' });
  scheduler.stop();
});

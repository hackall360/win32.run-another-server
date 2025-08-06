import { test } from 'node:test';
import assert from 'node:assert';
import { SyscallDispatcher } from '../system/syscall.js';

test('syscall dispatcher routes to service table', () => {
  const sys = new SyscallDispatcher();
  sys.registerService(1, (a, b) => a + b);
  assert.strictEqual(sys.invoke(1, 2, 3), 5);
});

test('syscall dispatcher handles traps', () => {
  const sys = new SyscallDispatcher();
  sys.registerTrap('pageFault', addr => `handled ${addr}`);
  assert.strictEqual(sys.trap('pageFault', '0x1'), 'handled 0x1');
});

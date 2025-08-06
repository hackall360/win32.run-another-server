import { test } from 'node:test';
import assert from 'node:assert';
import { PhysicalMemory } from '../kernel/memory/physicalMemory.js';
import { VirtualMemory } from '../kernel/memory/virtualMemory.js';

// Test physical frame allocation and free

test('physical memory allocates and frees frames', () => {
  const pm = new PhysicalMemory(8, 4096, 1); // 7 frames available
  const frames = [];
  for (let i = 0; i < 7; i++) {
    frames.push(pm.allocateFrame());
  }
  assert.throws(() => pm.allocateFrame());
  pm.freeFrame(frames[3]);
  const frame = pm.allocateFrame();
  assert.strictEqual(typeof frame, 'number');
});

// Test virtual memory allocation and access

test('virtual memory reads and writes', () => {
  const pm = new PhysicalMemory(32);
  const vm = new VirtualMemory(pm);
  const addr = vm.allocate(1000);
  vm.writeByte(addr, 0x2a);
  assert.strictEqual(vm.readByte(addr), 0x2a);
});

// Test deallocation and page fault

test('virtual memory deallocation triggers page fault', () => {
  const pm = new PhysicalMemory(32);
  const vm = new VirtualMemory(pm);
  const addr = vm.allocate(4096);
  vm.deallocate(addr, 4096);
  assert.throws(() => vm.readByte(addr), /Page fault/);
});

// Kernel heap allocation

test('kernel heap allocation returns unique addresses', () => {
  const pm = new PhysicalMemory(16, 1024, 2);
  const a = pm.allocateKernel(64);
  const b = pm.allocateKernel(32);
  assert.ok(b > a);
});

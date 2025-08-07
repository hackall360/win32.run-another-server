import { test } from 'node:test';
import assert from 'node:assert';
import { PhysicalMemory } from '../kernel/memory/physicalMemory.js';
import { VirtualMemory } from '../kernel/memory/virtualMemory.js';
import { FATFileSystem } from '../kernel/executive/fs/fat.js';

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

// Test deallocation and demand paging

test('virtual memory deallocation allocates on access', () => {
  const pm = new PhysicalMemory(32);
  const vm = new VirtualMemory(pm);
  const addr = vm.allocate(4096);
  vm.deallocate(addr, 4096);
  vm.writeByte(addr, 0x11); // triggers on-demand allocation
  assert.strictEqual(vm.readByte(addr), 0x11);
});

// Test permission enforcement

test('permission violations are detected', () => {
  const pm = new PhysicalMemory(32);
  const vm = new VirtualMemory(pm);
  const addr = vm.allocate(4096, { read: true, write: false });
  assert.throws(() => vm.writeByte(addr, 1), /Permission/);
});

// Test lazy allocation via page fault handler

test('pages are allocated on demand', () => {
  const pm = new PhysicalMemory(32);
  const vm = new VirtualMemory(pm);
  const addr = vm.reserve(4096);
  const vpage = Math.floor(addr / vm.pageSize);
  let entry = vm.pageTable.get(vpage);
  assert.ok(entry && !entry.present);
  vm.writeByte(addr, 0x33); // should trigger allocation
  entry = vm.pageTable.get(vpage);
  assert.ok(entry.present && entry.frame !== null);
  assert.strictEqual(vm.readByte(addr), 0x33);
});

// Kernel heap allocation

test('kernel heap allocation returns unique addresses', () => {
  const pm = new PhysicalMemory(16, 1024, 2);
  const a = pm.allocateKernel(64);
  const b = pm.allocateKernel(32);
  assert.ok(b > a);
});

// File-backed mappings with copy-on-write

test('file mappings flush and enforce copy-on-write', () => {
  const pm = new PhysicalMemory(64);
  const vm = new VirtualMemory(pm);
  const fs = new FATFileSystem();
  fs.mount();
  fs.writeFile('/file.txt', Buffer.from('A'));
  const addr1 = vm.mapFile(fs, '/file.txt', vm.pageSize);
  const addr2 = vm.mapFile(fs, '/file.txt', vm.pageSize);
  vm.writeByte(addr1, 'B'.charCodeAt(0));
  assert.strictEqual(vm.readByte(addr2), 'A'.charCodeAt(0));
  vm.unmapFile(addr1, vm.pageSize); // should flush changes
  const data = fs.readFile('/file.txt');
  assert.strictEqual(data[0], 'B'.charCodeAt(0));
  assert.strictEqual(vm.readByte(addr2), 'A'.charCodeAt(0));
  vm.unmapFile(addr2, vm.pageSize);
});

test('flush writes dirty pages without unmapping', () => {
  const pm = new PhysicalMemory(64);
  const vm = new VirtualMemory(pm);
  const fs = new FATFileSystem();
  fs.mount();
  fs.writeFile('/flush.txt', Buffer.from('x'));
  const addr = vm.mapFile(fs, '/flush.txt', vm.pageSize, { shared: false });
  vm.writeByte(addr, 'y'.charCodeAt(0));
  vm.flush(addr, vm.pageSize);
  assert.strictEqual(fs.readFile('/flush.txt')[0], 'y'.charCodeAt(0));
  vm.unmapFile(addr, vm.pageSize);
});

import { logError } from '../../system/eventLog.js';
import { createCrashDump } from '../../system/crashDump.js';

export class PhysicalMemory {
  constructor(totalPages = 256, pageSize = 4096, kernelHeapPages = 16) {
    this.pageSize = pageSize;
    this.totalPages = totalPages;
    this.memory = Buffer.alloc(totalPages * pageSize);

    // Kernel heap reserved at beginning of physical memory
    this.kernelHeap = {
      start: 0,
      size: kernelHeapPages * pageSize,
      next: 0
    };

    // Free frames start after kernel heap
    this.freeFrames = new Set();
    for (let i = kernelHeapPages; i < totalPages; i++) {
      this.freeFrames.add(i);
    }
  }

  allocateFrame() {
    const iterator = this.freeFrames.values();
    const result = iterator.next();
    if (result.done) {
      const error = new Error('Out of physical memory');
      logError('PhysicalMemory.allocateFrame', error);
      createCrashDump('out_of_physical_memory');
      throw error;
    }
    const frame = result.value;
    this.freeFrames.delete(frame);
    return frame;
  }

  freeFrame(frame) {
    if (frame < 0 || frame >= this.totalPages) {
      const error = new Error('Invalid frame number');
      logError('PhysicalMemory.freeFrame', error, { frame });
      createCrashDump('invalid_frame_number', { frame });
      throw error;
    }
    this.freeFrames.add(frame);
  }

  readByte(physicalAddress) {
    return this.memory[physicalAddress];
  }

  writeByte(physicalAddress, value) {
    this.memory[physicalAddress] = value & 0xff;
  }

  allocateKernel(size) {
    const { start, size: heapSize, next } = this.kernelHeap;
    if (next + size > heapSize) {
      const error = new Error('Kernel heap exhausted');
      logError('PhysicalMemory.allocateKernel', error, { size });
      createCrashDump('kernel_heap_exhausted', { size });
      throw error;
    }
    const addr = start + next;
    this.kernelHeap.next += size;
    return addr;
  }
}

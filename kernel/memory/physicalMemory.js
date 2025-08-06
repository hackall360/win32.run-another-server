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
      throw new Error('Out of physical memory');
    }
    const frame = result.value;
    this.freeFrames.delete(frame);
    return frame;
  }

  freeFrame(frame) {
    if (frame < 0 || frame >= this.totalPages) {
      throw new Error('Invalid frame number');
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
      throw new Error('Kernel heap exhausted');
    }
    const addr = start + next;
    this.kernelHeap.next += size;
    return addr;
  }
}

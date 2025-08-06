import { PhysicalMemory } from './physicalMemory.js';

export class VirtualMemory {
  constructor(physical = new PhysicalMemory()) {
    this.physical = physical;
    this.pageSize = physical.pageSize;
    this.pageTable = new Map(); // virtualPage -> physicalFrame
    this.nextVirtualPage = 0;
    this.pageFaultHandler = addr => {
      throw new Error(`Page fault at address ${addr}`);
    };
  }

  setPageFaultHandler(handler) {
    this.pageFaultHandler = handler;
  }

  allocate(size) {
    const pages = Math.ceil(size / this.pageSize);
    const startPage = this.nextVirtualPage;
    for (let i = 0; i < pages; i++) {
      const frame = this.physical.allocateFrame();
      const vpage = startPage + i;
      this.pageTable.set(vpage, frame);
    }
    this.nextVirtualPage += pages;
    return startPage * this.pageSize;
  }

  deallocate(virtualAddress, size) {
    const startPage = Math.floor(virtualAddress / this.pageSize);
    const pages = Math.ceil(size / this.pageSize);
    for (let i = 0; i < pages; i++) {
      const vpage = startPage + i;
      const frame = this.pageTable.get(vpage);
      if (frame !== undefined) {
        this.physical.freeFrame(frame);
        this.pageTable.delete(vpage);
      }
    }
  }

  translate(virtualAddress) {
    const vpage = Math.floor(virtualAddress / this.pageSize);
    const offset = virtualAddress % this.pageSize;
    const frame = this.pageTable.get(vpage);
    if (frame === undefined) {
      this.pageFaultHandler(virtualAddress);
      return null; // in case handler does not throw
    }
    return frame * this.pageSize + offset;
  }

  readByte(virtualAddress) {
    const phys = this.translate(virtualAddress);
    if (phys === null) return undefined;
    return this.physical.readByte(phys);
  }

  writeByte(virtualAddress, value) {
    const phys = this.translate(virtualAddress);
    if (phys === null) return;
    this.physical.writeByte(phys, value);
  }
}

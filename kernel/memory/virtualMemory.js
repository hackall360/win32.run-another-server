import { PhysicalMemory } from './physicalMemory.js';

// Permission helper
function normalizePerms(perms = {}) {
  return {
    read: perms.read !== false,
    write: perms.write !== false,
    exec: perms.exec === true
  };
}

export class VirtualMemory {
  constructor(physical = new PhysicalMemory()) {
    this.physical = physical;
    this.pageSize = physical.pageSize;

    // virtualPage -> { frame, present, perms, swap? }
    this.pageTable = new Map();
    this.nextVirtualPage = 0;

    // swapArea stores page data when swapped out
    this.swapArea = new Map(); // vpage -> Buffer

    this.pageFaultHandler = this.defaultPageFaultHandler.bind(this);
  }

  /**
   * Default page fault handler. Allocates a new frame on demand or
   * loads the page contents from the swap area if available.
   */
  defaultPageFaultHandler(addr) {
    const vpage = Math.floor(addr / this.pageSize);
    let entry = this.pageTable.get(vpage);

    // No entry exists - allocate a new page with default perms
    if (!entry) {
      const frame = this.physical.allocateFrame();
      entry = {
        frame,
        present: true,
        perms: normalizePerms(),
      };
      this.pageTable.set(vpage, entry);
      this.physical.memory.fill(
        0,
        frame * this.pageSize,
        (frame + 1) * this.pageSize
      );
      return;
    }

    // Entry exists but not present - allocate frame and load
    if (!entry.present) {
      const frame = this.physical.allocateFrame();
      entry.frame = frame;
      entry.present = true;

      if (entry.swap) {
        // load from swap
        entry.swap.copy(
          this.physical.memory,
          frame * this.pageSize,
          0,
          this.pageSize
        );
        this.swapArea.delete(vpage);
        delete entry.swap;
      } else {
        // zero fill for demand allocation
        this.physical.memory.fill(
          0,
          frame * this.pageSize,
          (frame + 1) * this.pageSize
        );
      }
      return;
    }

    throw new Error(`Page fault at address ${addr}`);
  }

  setPageFaultHandler(handler) {
    this.pageFaultHandler = handler;
  }

  allocate(size, perms) {
    const pages = Math.ceil(size / this.pageSize);
    const startPage = this.nextVirtualPage;
    for (let i = 0; i < pages; i++) {
      const frame = this.physical.allocateFrame();
      const vpage = startPage + i;
      this.pageTable.set(vpage, {
        frame,
        present: true,
        perms: normalizePerms(perms)
      });
    }
    this.nextVirtualPage += pages;
    return startPage * this.pageSize;
  }

  /**
   * Reserve a range of virtual pages without allocating physical memory.
   */
  reserve(size, perms) {
    const pages = Math.ceil(size / this.pageSize);
    const startPage = this.nextVirtualPage;
    for (let i = 0; i < pages; i++) {
      const vpage = startPage + i;
      this.pageTable.set(vpage, {
        frame: null,
        present: false,
        perms: normalizePerms(perms)
      });
    }
    this.nextVirtualPage += pages;
    return startPage * this.pageSize;
  }

  /**
   * Map an arbitrary virtual address to a physical frame.
   */
  map(virtualAddress, frame = null, options = {}) {
    const vpage = Math.floor(virtualAddress / this.pageSize);
    const entry = {
      frame,
      present: frame !== null && options.present !== false,
      perms: normalizePerms(options.perms),
    };
    if (options.swap) {
      entry.present = false;
      entry.swap = Buffer.from(options.swap);
      this.swapArea.set(vpage, entry.swap);
    }
    this.pageTable.set(vpage, entry);
  }

  /**
   * Remove mappings for a range of virtual addresses
   */
  unmap(virtualAddress, size) {
    const startPage = Math.floor(virtualAddress / this.pageSize);
    const pages = Math.ceil(size / this.pageSize);
    for (let i = 0; i < pages; i++) {
      const vpage = startPage + i;
      const entry = this.pageTable.get(vpage);
      if (entry) {
        if (entry.present && entry.frame !== null) {
          this.physical.freeFrame(entry.frame);
        }
        this.pageTable.delete(vpage);
        this.swapArea.delete(vpage);
      }
    }
  }

  /**
   * Change permissions on a range of pages
   */
  protect(virtualAddress, size, perms) {
    const startPage = Math.floor(virtualAddress / this.pageSize);
    const pages = Math.ceil(size / this.pageSize);
    for (let i = 0; i < pages; i++) {
      const vpage = startPage + i;
      const entry = this.pageTable.get(vpage);
      if (entry) {
        entry.perms = { ...entry.perms, ...normalizePerms(perms) };
      }
    }
  }

  /**
   * Swap a page out to the swap area
   */
  swapOut(virtualAddress) {
    const vpage = Math.floor(virtualAddress / this.pageSize);
    const entry = this.pageTable.get(vpage);
    if (entry && entry.present && entry.frame !== null) {
      const buffer = Buffer.alloc(this.pageSize);
      this.physical.memory.copy(
        buffer,
        0,
        entry.frame * this.pageSize,
        (entry.frame + 1) * this.pageSize
      );
      entry.present = false;
      entry.swap = buffer;
      this.swapArea.set(vpage, buffer);
      this.physical.freeFrame(entry.frame);
      entry.frame = null;
    }
  }

  deallocate(virtualAddress, size) {
    this.unmap(virtualAddress, size);
  }

  translate(virtualAddress, mode = 'read') {
    const vpage = Math.floor(virtualAddress / this.pageSize);
    const offset = virtualAddress % this.pageSize;
    let entry = this.pageTable.get(vpage);
    if (!entry || !entry.present) {
      this.pageFaultHandler(virtualAddress);
      entry = this.pageTable.get(vpage);
      if (!entry || !entry.present) {
        return null; // handler did not resolve
      }
    }
    if (!entry.perms[mode]) {
      throw new Error('Permission violation');
    }
    return entry.frame * this.pageSize + offset;
  }

  readByte(virtualAddress) {
    const phys = this.translate(virtualAddress, 'read');
    if (phys === null) return undefined;
    return this.physical.readByte(phys);
  }

  writeByte(virtualAddress, value) {
    const phys = this.translate(virtualAddress, 'write');
    if (phys === null) return;
    this.physical.writeByte(phys, value);
  }
}

import { PhysicalMemory } from './physicalMemory.js';
import { logError } from '../../system/eventLog.js';
import { createCrashDump } from '../../system/crashDump.js';

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

    // file-backed mappings: key -> { frame, refCount, fs, path, offset, dirty }
    this.fileMappings = new Map();

    // LRU tracker: virtual page -> true (Map preserves insertion order)
    this.lru = new Map();

    this.pageFaultHandler = this.defaultPageFaultHandler.bind(this);
  }

  _touch(vpage) {
    const entry = this.pageTable.get(vpage);
    if (!entry || !entry.present) return;
    this.lru.delete(vpage);
    this.lru.set(vpage, true);
  }

  _evictLeastRecentlyUsed() {
    const iterator = this.lru.keys();
    const next = iterator.next();
    if (next.done) {
      const error = new Error('Out of physical memory');
      logError('VirtualMemory._evictLeastRecentlyUsed', error);
      createCrashDump('out_of_physical_memory');
      throw error;
    }
    const vpage = next.value;
    this.swapOut(vpage * this.pageSize);
  }

  _allocateFrame() {
    try {
      return this.physical.allocateFrame();
    } catch (err) {
      if (err.message === 'Out of physical memory') {
        this._evictLeastRecentlyUsed();
        return this.physical.allocateFrame();
      }
      throw err;
    }
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
      const frame = this._allocateFrame();
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
      this._touch(vpage);
      return;
    }

    // Entry exists but not present - allocate frame and load
    if (!entry.present) {
      const frame = this._allocateFrame();
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
      this._touch(vpage);
      return;
    }

    const error = new Error(`Page fault at address ${addr}`);
    logError('VirtualMemory.pageFault', error, { addr });
    createCrashDump('page_fault', { addr });
    throw error;
  }

  setPageFaultHandler(handler) {
    this.pageFaultHandler = handler;
  }

  allocate(size, perms) {
    const pages = Math.ceil(size / this.pageSize);
    const startPage = this.nextVirtualPage;
    for (let i = 0; i < pages; i++) {
      const frame = this._allocateFrame();
      const vpage = startPage + i;
      this.pageTable.set(vpage, {
        frame,
        present: true,
        perms: normalizePerms(perms)
      });
      this._touch(vpage);
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
    if (entry.present) this._touch(vpage);
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
        this.lru.delete(vpage);
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
      this.lru.delete(vpage);
    }
  }

  _writeBack(fs, path, offset, data) {
    const file = Buffer.from(fs.readFile(path));
    const end = offset + data.length;
    let buf = file;
    if (end > file.length) {
      buf = Buffer.alloc(end);
      file.copy(buf, 0, 0, file.length);
    }
    data.copy(buf, offset);
    fs.writeFile(path, buf);
  }

  flush(virtualAddress = 0, size = this.nextVirtualPage * this.pageSize) {
    const startPage = Math.floor(virtualAddress / this.pageSize);
    const pages = Math.ceil(size / this.pageSize);
    for (let i = 0; i < pages; i++) {
      const vpage = startPage + i;
      const entry = this.pageTable.get(vpage);
      if (!entry || !entry.file) continue;
      if (entry.file.key) {
        const ref = this.fileMappings.get(entry.file.key);
        if (ref && ref.dirty) {
          const buffer = Buffer.alloc(this.pageSize);
          this.physical.memory.copy(
            buffer,
            0,
            ref.frame * this.pageSize,
            (ref.frame + 1) * this.pageSize
          );
          this._writeBack(ref.fs, ref.path, ref.offset, buffer);
          ref.dirty = false;
        }
      } else if (entry.file.dirty) {
        const buffer = Buffer.alloc(this.pageSize);
        this.physical.memory.copy(
          buffer,
          0,
          entry.frame * this.pageSize,
          (entry.frame + 1) * this.pageSize
        );
        this._writeBack(entry.file.fs, entry.file.path, entry.file.offset, buffer);
        entry.file.dirty = false;
      }
    }
  }

  mapFile(fs, path, size, options = {}) {
    const { offset = 0, perms, shared = true } = options;
    const pages = Math.ceil(size / this.pageSize);
    const startPage = this.nextVirtualPage;
    const fileBuf = fs.readFile(path);
    for (let i = 0; i < pages; i++) {
      const fileOffset = offset + i * this.pageSize;
      const key = `${fs.volumeId}:${path}:${Math.floor(fileOffset / this.pageSize)}`;
      let frame;
      if (shared && this.fileMappings.has(key)) {
        const ref = this.fileMappings.get(key);
        frame = ref.frame;
        ref.refCount++;
      } else {
        frame = this._allocateFrame();
        this.physical.memory.fill(
          0,
          frame * this.pageSize,
          (frame + 1) * this.pageSize
        );
        fileBuf.copy(
          this.physical.memory,
          frame * this.pageSize,
          fileOffset,
          fileOffset + this.pageSize
        );
        if (shared) {
          this.fileMappings.set(key, {
            frame,
            refCount: 1,
            fs,
            path,
            offset: fileOffset,
            dirty: false,
          });
        }
      }
      const vpage = startPage + i;
      const entry = {
        frame,
        present: true,
        perms: normalizePerms(perms),
      };
      if (shared) {
        entry.file = { key };
      } else {
        entry.file = { fs, path, offset: fileOffset, shared: false, dirty: false };
      }
      this.pageTable.set(vpage, entry);
      this._touch(vpage);
    }
    this.nextVirtualPage += pages;
    return startPage * this.pageSize;
  }

  unmapFile(virtualAddress, size) {
    this.flush(virtualAddress, size);
    const startPage = Math.floor(virtualAddress / this.pageSize);
    const pages = Math.ceil(size / this.pageSize);
    for (let i = 0; i < pages; i++) {
      const vpage = startPage + i;
      const entry = this.pageTable.get(vpage);
      if (!entry) continue;
      if (entry.file && entry.file.key) {
        const ref = this.fileMappings.get(entry.file.key);
        if (ref) {
          ref.refCount--;
          if (ref.refCount === 0) {
            this.physical.freeFrame(ref.frame);
            this.fileMappings.delete(entry.file.key);
          }
        }
      } else if (entry.file) {
        this.physical.freeFrame(entry.frame);
      } else if (entry.present && entry.frame !== null) {
        this.physical.freeFrame(entry.frame);
      }
      this.pageTable.delete(vpage);
      this.swapArea.delete(vpage);
      this.lru.delete(vpage);
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
      const error = new Error('Permission violation');
      logError('VirtualMemory.translate', error, { address: virtualAddress, mode });
      createCrashDump('permission_violation', { address: virtualAddress, mode });
      throw error;
    }
    if (mode === 'write' && entry.file) {
      if (entry.file.key) {
        const ref = this.fileMappings.get(entry.file.key);
        if (ref && ref.refCount > 1) {
          const newFrame = this._allocateFrame();
          this.physical.memory.copy(
            this.physical.memory,
            newFrame * this.pageSize,
            ref.frame * this.pageSize,
            (ref.frame + 1) * this.pageSize
          );
          ref.refCount--;
          entry.frame = newFrame;
          entry.file = {
            fs: ref.fs,
            path: ref.path,
            offset: ref.offset,
            shared: false,
            dirty: true,
          };
        } else if (ref) {
          ref.dirty = true;
        }
      } else {
        entry.file.dirty = true;
      }
    }
    this._touch(vpage);
    return entry.frame * this.pageSize + offset;
  }

  readByte(virtualAddress) {
    const phys = this.translate(virtualAddress, 'read');
    if (phys === null) return undefined;
    this._touch(Math.floor(virtualAddress / this.pageSize));
    return this.physical.readByte(phys);
  }

  writeByte(virtualAddress, value) {
    const phys = this.translate(virtualAddress, 'write');
    if (phys === null) return;
    this._touch(Math.floor(virtualAddress / this.pageSize));
    this.physical.writeByte(phys, value);
  }
}

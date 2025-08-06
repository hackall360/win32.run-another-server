export class Loader {
  constructor() {
    this.modules = new Map();
  }

  /**
   * Parse minimal PE/COFF headers from an ArrayBuffer.
   * Validates DOS and PE signatures and extracts the entry point.
   * @param {ArrayBuffer} buffer
   * @returns {Object} Parsed header info
   */
  parse(buffer) {
    const view = new DataView(buffer);
    // Check DOS header 'MZ'
    if (view.getUint16(0, false) !== 0x4d5a) {
      throw new Error('Invalid DOS signature');
    }
    const peOffset = view.getUint32(0x3c, true);
    if (view.getUint32(peOffset, false) !== 0x50450000) {
      throw new Error('Invalid PE signature');
    }
    const machine = view.getUint16(peOffset + 4, true);
    const numberOfSections = view.getUint16(peOffset + 6, true);
    const optionalHeaderSize = view.getUint16(peOffset + 20, true);
    const optOffset = peOffset + 24;
    const entryPoint = view.getUint32(optOffset + 16, true);
    return { machine, numberOfSections, optionalHeaderSize, entryPoint };
  }

  /**
   * Load a PE module and invoke its entry point.
   * @param {string} name Module name
   * @param {ArrayBuffer} buffer Binary contents
   * @param {Object} [options] Additional options
   * @param {function} [options.entry] Driver entry routine
   * @param {function} [options.unload] Cleanup routine
   * @param {string} [options.version] Module version string
   * @returns {Object} Loaded module metadata
   */
  load(name, buffer, options = {}) {
    const headers = this.parse(buffer);
    const module = {
      name,
      headers,
      version: options.version || '0.0.0',
      entry: options.entry,
      unload: options.unload
    };
    if (typeof module.entry === 'function') {
      module.entry(module);
    }
    this.modules.set(name, module);
    return module;
  }

  /**
   * Unload a module and invoke its cleanup routine.
   * @param {string} name Module name
   */
  unload(name) {
    const module = this.modules.get(name);
    if (!module) return;
    if (typeof module.unload === 'function') {
      module.unload(module);
    }
    this.modules.delete(name);
  }

  /**
   * Retrieve loaded module metadata.
   * @param {string} name Module name
   */
  get(name) {
    return this.modules.get(name);
  }
}

export const loader = new Loader();
export default loader;

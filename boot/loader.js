import bootstrap from '../kernel/bootstrap.js';

/**
 * BootLoader reads configuration from a filesystem, resolves module
 * dependencies and initializes the kernel via bootstrap().
 */
export class BootLoader {
  /**
   * @param {Object} fs Mounted filesystem implementing readFile()
   */
  constructor(fs) {
    if (!fs || typeof fs.readFile !== 'function') {
      throw new Error('BootLoader requires a filesystem with readFile()');
    }
    this.fs = fs;
  }

  /**
   * Initialize the system using the boot configuration.
   *
   * @param {string} [configPath] Path to boot configuration file
   * @param {Object} [options]
   * @param {boolean} [options.safeMode] Load only modules marked safe
   * @returns {Promise<Object>} Result from kernel bootstrap
   */
  async load(configPath = '/boot/boot.json', options = {}) {
    const { safeMode = false } = options;
    let config;
    try {
      const raw = this.fs.readFile(configPath).toString() || '{}';
      config = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Failed to read boot configuration: ${e.message}`);
    }
    return this._bootWithConfig(config, { safeMode });
  }

  async _bootWithConfig(config, { safeMode = false, recovery = false } = {}) {
    const moduleDefs = this._selectModules(config, safeMode);
    try {
      const kernelModules = await loadModules(this.fs, moduleDefs);
      return await bootstrap({ kernelModules });
    } catch (err) {
      if (config.recovery && !recovery) {
        const recSafe = safeMode || !!config.recovery.safeMode;
        return this._bootWithConfig(config.recovery, {
          safeMode: recSafe,
          recovery: true
        });
      }
      throw err;
    }
  }

  _selectModules(config, safeMode) {
    let mods = Array.isArray(config.modules) ? [...config.modules] : [];
    if (safeMode) {
      mods = mods.filter(m => m.safe !== false);
    }
    return mods;
  }
}

function resolveDependencies(modules) {
  const map = new Map();
  for (const m of modules) map.set(m.name, m);
  const visited = new Set();
  const temp = new Set();
  const order = [];
  function visit(name) {
    if (visited.has(name)) return;
    if (temp.has(name)) throw new Error(`Circular dependency: ${name}`);
    const mod = map.get(name);
    if (!mod) throw new Error(`Missing module: ${name}`);
    temp.add(name);
    for (const dep of mod.deps || []) visit(dep);
    temp.delete(name);
    visited.add(name);
    order.push(mod);
  }
  for (const m of modules) visit(m.name);
  return order;
}

async function loadModules(fs, moduleDefs) {
  const ordered = resolveDependencies(moduleDefs);
  const loaded = [];
  for (const info of ordered) {
    const src = fs.readFile(info.path).toString();
    const url = 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
    const mod = await import(url);
    loaded.push({ name: info.name, module: mod.default ?? mod });
  }
  return loaded;
}

/**
 * Convenience function to create and run the BootLoader.
 *
 * @param {Object} options Loader options
 * @param {Object} options.fs Filesystem instance
 * @param {string} [options.configPath] Path to configuration file
 * @param {boolean} [options.safeMode] Safe mode flag
 * @returns {Promise<Object>} Result from kernel bootstrap
 */
export async function load(options = {}) {
  const { fs, configPath, safeMode } = options;
  const loader = new BootLoader(fs);
  return loader.load(configPath, { safeMode });
}

export default load;

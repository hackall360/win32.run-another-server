import { cacheManager } from './cacheManager.js';

export class FATFileSystem {
  constructor() {
    this.volumeId = `fat-${Math.random().toString(16).slice(2)}`;
    this.mounted = false;
    this.files = new Map(); // normalizedPath -> { data: Buffer, metadata }
  }

  mount() {
    this.mounted = true;
  }

  _normalizePath(path) {
    return path.replace(/\\/g, '/').toUpperCase();
  }

  readFile(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    return cacheManager.read(this, path, () => {
      const key = this._normalizePath(path);
      const file = this.files.get(key);
      if (!file) throw new Error('File not found');
      return file.data;
    });
  }

  writeFile(path, data) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    cacheManager.write(this, path, Buffer.isBuffer(data) ? data : Buffer.from(data), d => {
      const key = this._normalizePath(path);
      const now = new Date();
      const file = this.files.get(key) || { metadata: { created: now } };
      file.data = d;
      file.metadata.size = d.length;
      file.metadata.modified = now;
      this.files.set(key, file);
    });
  }

  getMetadata(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    return cacheManager.getMetadata(this, path, () => {
      const key = this._normalizePath(path);
      const file = this.files.get(key);
      if (!file) throw new Error('File not found');
      return file.metadata;
    });
  }

  listFiles() {
    return Array.from(this.files.keys());
  }
}

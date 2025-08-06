import { cacheManager } from './cacheManager.js';
import { normalizePath, splitPath } from './pathUtils.js';

export class NTFSFileSystem {
  constructor() {
    this.volumeId = `ntfs-${Math.random().toString(16).slice(2)}`;
    this.mounted = false;
    this.root = { type: 'dir', children: new Map() };
    this.handleTable = new Map(); // handle -> { node, path }
    this.nextHandle = 1;
  }

  mount() {
    this.mounted = true;
  }

  _normalizePath(path) {
    return normalizePath(path, s => s.toLowerCase());
  }

  _getDir(path, create = false) {
    const parts = splitPath(path);
    let node = this.root;
    for (const part of parts) {
      let next = node.children.get(part);
      if (!next) {
        if (!create) throw new Error('Directory not found');
        next = { type: 'dir', children: new Map() };
        node.children.set(part, next);
      }
      if (next.type !== 'dir') throw new Error('Not a directory');
      node = next;
    }
    return node;
  }

  _getFile(path, create = false) {
    const parts = splitPath(path);
    const name = parts.pop();
    const dir = this._getDir('/' + parts.join('/'), create);
    let file = dir.children.get(name);
    if (!file) {
      if (!create) throw new Error('File not found');
      const now = new Date();
      file = { type: 'file', data: Buffer.alloc(0), metadata: { created: now, modified: now, size: 0 }, refCount: 0 };
      dir.children.set(name, file);
    }
    if (file.type !== 'file') throw new Error('Not a file');
    return file;
  }

  readFile(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    return cacheManager.read(this, key, () => {
      const file = this._getFile(key);
      return file.data;
    });
  }

  writeFile(path, data) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    cacheManager.write(this, key, buf, d => {
      const file = this._getFile(key, true);
      file.data = d;
      file.metadata.size = d.length;
      file.metadata.modified = new Date();
    });
  }

  getMetadata(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    return cacheManager.getMetadata(this, key, () => {
      const file = this._getFile(key);
      return file.metadata;
    });
  }

  mkdir(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const parts = splitPath(key);
    const name = parts.pop();
    const dir = this._getDir('/' + parts.join('/'));
    if (dir.children.has(name)) throw new Error('File exists');
    dir.children.set(name, { type: 'dir', children: new Map() });
  }

  listDir(path = '/') {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const dir = this._getDir(key);
    return Array.from(dir.children.keys());
  }

  remove(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const parts = splitPath(key);
    const name = parts.pop();
    const dir = this._getDir('/' + parts.join('/'));
    const node = dir.children.get(name);
    if (!node) throw new Error('Path not found');
    if (node.type === 'dir') {
      if (node.children.size > 0) throw new Error('Directory not empty');
    } else if (node.refCount > 0) {
      throw new Error('File in use');
    }
    dir.children.delete(name);
    cacheManager.invalidate(this, key);
  }

  open(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const file = this._getFile(key);
    const handle = this.nextHandle++;
    this.handleTable.set(handle, { node: file, path: key });
    file.refCount++;
    return handle;
  }

  read(handle) {
    const h = this.handleTable.get(handle);
    if (!h) throw new Error('Invalid handle');
    return cacheManager.read(this, h.path, () => h.node.data);
  }

  write(handle, data) {
    const h = this.handleTable.get(handle);
    if (!h) throw new Error('Invalid handle');
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    cacheManager.write(this, h.path, buf, d => {
      h.node.data = d;
      h.node.metadata.size = d.length;
      h.node.metadata.modified = new Date();
    });
  }

  close(handle) {
    const h = this.handleTable.get(handle);
    if (!h) return;
    this.handleTable.delete(handle);
    h.node.refCount--;
  }

  listFiles() {
    const results = [];
    function walk(node, path) {
      for (const [name, child] of node.children.entries()) {
        const p = path + '/' + name;
        if (child.type === 'file') results.push(p);
        else walk(child, p);
      }
    }
    walk(this.root, '');
    return results.map(p => p || '/');
  }
}

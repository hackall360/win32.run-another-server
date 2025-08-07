import { cacheManager } from './cacheManager.js';
import { normalizePath, splitPath } from './pathUtils.js';
import { systemToken } from '../security.js';

export class NTFSFileSystem {
  constructor() {
    this.volumeId = `ntfs-${Math.random().toString(16).slice(2)}`;
    this.mounted = false;
    this.root = { type: 'dir', children: new Map(), security: this._createSecurityDescriptor(systemToken.sid) };
    this.journal = [];
    this.journalNode = {
      type: 'file',
      data: Buffer.alloc(0),
      metadata: { created: new Date(), modified: new Date(), size: 0 },
      refCount: 0,
      security: this._createSecurityDescriptor(systemToken.sid)
    };
    this.root.children.set('$journal', this.journalNode);
    this.handleTable = new Map(); // handle -> { node, path, rights, token }
    this.nextHandle = 1;
  }

  mount() {
    if (this.journalNode.data.length > 0) {
      this._replayJournal();
    }
    this.mounted = true;
  }

  unmount() {
    this.mounted = false;
  }

  _createSecurityDescriptor(ownerSid = systemToken.sid) {
    const dacl = new Map();
    dacl.set(ownerSid, new Set(['read', 'write']));
    dacl.set('everyone', new Set(['read']));
    return { owner: ownerSid, dacl };
  }

  _checkAccess(node, token, rights = []) {
    if (token.sid === node.security.owner) return true;
    const sids = [token.sid, ...(token.groups || []), 'everyone'];
    for (const sid of sids) {
      const perms = node.security.dacl.get(sid);
      if (perms && rights.every(r => perms.has(r))) return true;
    }
    return false;
  }

  _log(entry) {
    this.journal.push(entry);
    this.journalNode.data = Buffer.from(JSON.stringify(this.journal));
    this.journalNode.metadata.size = this.journalNode.data.length;
    this.journalNode.metadata.modified = new Date();
  }

  _commit() {
    this.journal = [];
    this.journalNode.data = Buffer.alloc(0);
    this.journalNode.metadata.size = 0;
    this.journalNode.metadata.modified = new Date();
  }

  _replayJournal() {
    const entries = JSON.parse(this.journalNode.data.toString() || '[]');
    for (const entry of entries) {
      switch (entry.op) {
        case 'writeFile':
        case 'write': {
          const buf = Buffer.from(entry.data, 'base64');
          const file = this._getFile(entry.path, true);
          file.data = buf;
          file.metadata.size = buf.length;
          file.metadata.modified = new Date();
          break;
        }
        case 'mkdir':
          this._getDir(entry.path, true);
          break;
        case 'remove': {
          const key = entry.path;
          const parts = splitPath(key);
          const name = parts.pop();
          const dir = this._getDir('/' + parts.join('/'));
          dir.children.delete(name);
          cacheManager.invalidate(this, key);
          break;
        }
      }
    }
    this._commit();
  }

  _normalizePath(path) {
    return normalizePath(path, s => s.toLowerCase());
  }

  _getDir(path, create = false, token = systemToken) {
    const parts = splitPath(path);
    let node = this.root;
    for (const part of parts) {
      let next = node.children.get(part);
      if (!next) {
        if (!create) throw new Error('Directory not found');
        next = { type: 'dir', children: new Map(), security: this._createSecurityDescriptor(token.sid) };
        node.children.set(part, next);
      }
      if (next.type !== 'dir') throw new Error('Not a directory');
      node = next;
    }
    return node;
  }

  _getFile(path, create = false, token = systemToken) {
    const parts = splitPath(path);
    const name = parts.pop();
    const dir = this._getDir('/' + parts.join('/'), create, token);
    let file = dir.children.get(name);
    if (!file) {
      if (!create) throw new Error('File not found');
      const now = new Date();
      file = {
        type: 'file',
        data: Buffer.alloc(0),
        metadata: { created: now, modified: now, size: 0 },
        refCount: 0,
        security: this._createSecurityDescriptor(token.sid)
      };
      dir.children.set(name, file);
    }
    if (file.type !== 'file') throw new Error('Not a file');
    return file;
  }

  readFile(path, options = {}) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const token = options.token || systemToken;
    const exec = () => cacheManager.read(this, key, () => {
      const file = this._getFile(key);
      if (!this._checkAccess(file, token, ['read'])) throw new Error('Access denied');
      return file.data;
    });
    if (options.async && options.completionPort) {
      setImmediate(() => {
        try {
          const data = exec();
          options.completionPort.post(path, { operation: 'readFile', data });
        } catch (e) {
          options.completionPort.post(path, { operation: 'readFile', error: e.message });
        }
      });
      return { status: 'pending' };
    }
    return exec();
  }

  writeFile(path, data, options = {}) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const token = options.token || systemToken;
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const exec = () => cacheManager.write(this, key, buf, d => {
      const file = this._getFile(key, true, token);
      if (!this._checkAccess(file, token, ['write'])) throw new Error('Access denied');
      this._log({ op: 'writeFile', path: key, data: d.toString('base64') });
      file.data = d;
      file.metadata.size = d.length;
      file.metadata.modified = new Date();
      this._commit();
    });
    if (options.async && options.completionPort) {
      setImmediate(() => {
        try {
          exec();
          options.completionPort.post(path, { operation: 'writeFile', bytes: buf.length });
        } catch (e) {
          options.completionPort.post(path, { operation: 'writeFile', error: e.message });
        }
      });
      return { status: 'pending' };
    }
    exec();
  }

  getMetadata(path) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    return cacheManager.getMetadata(this, key, () => {
      const file = this._getFile(key);
      return file.metadata;
    });
  }

  mkdir(path, options = {}) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const token = options.token || systemToken;
    const key = this._normalizePath(path);
    const parts = splitPath(key);
    const name = parts.pop();
    const dir = this._getDir('/' + parts.join('/'), false, token);
    if (dir.children.has(name)) throw new Error('File exists');
    this._log({ op: 'mkdir', path: key });
    dir.children.set(name, { type: 'dir', children: new Map(), security: this._createSecurityDescriptor(token.sid) });
    this._commit();
  }

  listDir(path = '/') {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const key = this._normalizePath(path);
    const dir = this._getDir(key);
    return Array.from(dir.children.keys()).filter(n => !n.startsWith('$'));
  }

  remove(path, options = {}) {
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
    this._log({ op: 'remove', path: key });
    dir.children.delete(name);
    cacheManager.invalidate(this, key);
    this._commit();
  }

  open(path, options = {}) {
    if (!this.mounted) throw new Error('Filesystem not mounted');
    const token = options.token || systemToken;
    const mode = options.mode || 'rw';
    const rights = [];
    if (mode.includes('r')) rights.push('read');
    if (mode.includes('w')) rights.push('write');
    const key = this._normalizePath(path);
    const file = this._getFile(key);
    if (!this._checkAccess(file, token, rights)) throw new Error('Access denied');
    const handle = this.nextHandle++;
    this.handleTable.set(handle, { node: file, path: key, rights: { read: rights.includes('read'), write: rights.includes('write') }, token });
    file.refCount++;
    return handle;
  }

  read(handle, options = {}) {
    const h = this.handleTable.get(handle);
    if (!h) throw new Error('Invalid handle');
    if (!h.rights.read) throw new Error('Access denied');
    const exec = () => cacheManager.read(this, h.path, () => h.node.data);
    if (options.async && options.completionPort) {
      setImmediate(() => {
        try {
          const data = exec();
          options.completionPort.post(handle, { operation: 'read', data });
        } catch (e) {
          options.completionPort.post(handle, { operation: 'read', error: e.message });
        }
      });
      return { status: 'pending' };
    }
    return exec();
  }

  write(handle, data, options = {}) {
    const h = this.handleTable.get(handle);
    if (!h) throw new Error('Invalid handle');
    if (!h.rights.write) throw new Error('Access denied');
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const exec = () => cacheManager.write(this, h.path, buf, d => {
      this._log({ op: 'write', path: h.path, data: d.toString('base64') });
      h.node.data = d;
      h.node.metadata.size = d.length;
      h.node.metadata.modified = new Date();
      this._commit();
    });
    if (options.async && options.completionPort) {
      setImmediate(() => {
        try {
          exec();
          options.completionPort.post(handle, { operation: 'write', bytes: buf.length });
        } catch (e) {
          options.completionPort.post(handle, { operation: 'write', error: e.message });
        }
      });
      return { status: 'pending' };
    }
    exec();
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

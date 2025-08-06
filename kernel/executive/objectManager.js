import { checkAccess, systemToken } from './security.js';

class Namespace {
  constructor() {
    this.objects = new Map(); // name -> entry
    this.children = new Map(); // name -> Namespace
  }
}

export class ObjectManager {
  constructor() {
    this.root = new Namespace();
    this.handleTable = new Map(); // handle -> { entry, rights }
    this.nextHandle = 1;
  }

  _split(path) {
    return path.split(/\\+/).filter(Boolean);
  }

  _resolve(path, create = false) {
    const parts = this._split(path);
    let ns = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!ns.children.has(part)) {
        if (!create) {
          throw new Error('Namespace not found');
        }
        ns.children.set(part, new Namespace());
      }
      ns = ns.children.get(part);
    }
    const name = parts[parts.length - 1];
    return { ns, name };
  }

  _getEntry(path) {
    const { ns, name } = this._resolve(path, false);
    const entry = ns.objects.get(name);
    if (!entry) {
      throw new Error('Object not found');
    }
    return entry;
  }

  registerObject(path, object, options = {}) {
    const { rights = ['read', 'write'], acl = {} } = options;
    const { ns, name } = this._resolve(path, true);
    if (ns.objects.has(name)) {
      throw new Error('Object already exists');
    }
    const entry = {
      object,
      rights: new Set(rights),
      acl: new Map(),
      refCount: 0
    };
    if (acl instanceof Map) {
      for (const [sid, rightsArr] of acl.entries()) {
        entry.acl.set(sid, new Set(rightsArr));
      }
    } else {
      for (const sid of Object.keys(acl)) {
        entry.acl.set(sid, new Set(acl[sid]));
      }
    }
    ns.objects.set(name, entry);
  }

  openHandle(path, desiredRights = ['read'], token = systemToken) {
    const entry = this._getEntry(path);
    if (!checkAccess(token, entry, desiredRights)) {
      throw new Error('Access denied');
    }
    const handle = this.nextHandle++;
    this.handleTable.set(handle, {
      entry,
      rights: new Set(desiredRights)
    });
    entry.refCount++;
    return handle;
  }

  getObject(handle, requiredRights = []) {
    const h = this.handleTable.get(handle);
    if (!h) {
      throw new Error('Invalid handle');
    }
    for (const r of requiredRights) {
      if (!h.rights.has(r)) {
        throw new Error('Access denied');
      }
    }
    return h.entry.object;
  }

  closeHandle(handle) {
    const h = this.handleTable.get(handle);
    if (!h) return;
    this.handleTable.delete(handle);
    h.entry.refCount--;
  }

  queryObject(path) {
    const entry = this._getEntry(path);
    return {
      refCount: entry.refCount,
      rights: Array.from(entry.rights),
      acl: Array.from(entry.acl.entries()).map(([sid, rights]) => [sid, Array.from(rights)])
    };
  }
}

export const objectManager = new ObjectManager();

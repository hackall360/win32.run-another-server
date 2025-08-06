import { EventEmitter } from 'events';
import fs from 'fs';

class RegistryNode {
  constructor(name, parent = null, value = null) {
    this.name = name;
    this.parent = parent;
    this.value = value;
    this.children = new Map();
    this.acl = new Map(); // user => { read: bool, write: bool }
  }
}

export class Registry extends EventEmitter {
  constructor() {
    super();
    this.root = new RegistryNode('root');
    // by default allow everyone
    this.root.acl.set('*', { read: true, write: true });
  }

  _parsePath(path) {
    if (!path) return [];
    return path.split('/').filter(Boolean);
  }

  _getNode(path) {
    const parts = this._parsePath(path);
    let node = this.root;
    for (const part of parts) {
      node = node.children.get(part);
      if (!node) return null;
    }
    return node;
  }

  _checkPermission(node, user, action) {
    let current = node;
    while (current) {
      if (current.acl.has(user)) {
        return !!current.acl.get(user)[action];
      }
      if (current.acl.has('*')) {
        return !!current.acl.get('*')[action];
      }
      current = current.parent;
    }
    return false;
  }

  create(key, value, { user = '*', acl } = {}) {
    const parts = this._parsePath(key);
    let node = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let child = node.children.get(part);
      if (!child) {
        if (!this._checkPermission(node, user, 'write')) {
          throw new Error('Access denied');
        }
        child = new RegistryNode(part, node);
        node.children.set(part, child);
      }
      node = child;
    }
    const last = parts[parts.length - 1];
    if (node.children.has(last)) {
      throw new Error('Key already exists');
    }
    if (!this._checkPermission(node, user, 'write')) {
      throw new Error('Access denied');
    }
    const newNode = new RegistryNode(last, node, value);
    if (acl) {
      for (const [usr, perm] of Object.entries(acl)) {
        newNode.acl.set(usr, perm);
      }
    }
    node.children.set(last, newNode);
    this.emit('create', key, value);
  }

  read(key, user = '*') {
    const node = this._getNode(key);
    if (!node) return undefined;
    if (!this._checkPermission(node, user, 'read')) {
      throw new Error('Access denied');
    }
    return node.value;
  }

  update(key, value, user = '*') {
    const node = this._getNode(key);
    if (!node) {
      throw new Error('Key not found');
    }
    if (!this._checkPermission(node, user, 'write')) {
      throw new Error('Access denied');
    }
    node.value = value;
    this.emit('update', key, value);
  }

  delete(key, user = '*') {
    const parts = this._parsePath(key);
    const last = parts.pop();
    const parentPath = parts.join('/');
    const parent = parts.length ? this._getNode(parentPath) : this.root;
    if (!parent || !parent.children.has(last)) {
      return;
    }
    const node = parent.children.get(last);
    if (!this._checkPermission(node, user, 'write')) {
      throw new Error('Access denied');
    }
    parent.children.delete(last);
    this.emit('delete', key);
  }

  keys(path = '') {
    const node = path ? this._getNode(path) : this.root;
    if (!node) return [];
    return Array.from(node.children.keys());
  }

  setACL(key, acl, user = '*') {
    const node = this._getNode(key);
    if (!node) {
      throw new Error('Key not found');
    }
    if (!this._checkPermission(node, user, 'write')) {
      throw new Error('Access denied');
    }
    node.acl.clear();
    for (const [usr, perm] of Object.entries(acl)) {
      node.acl.set(usr, perm);
    }
  }

  saveToFile(file) {
    const obj = this._nodeToObject(this.root);
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  }

  loadFromFile(file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    this.root = this._objectToNode('root', data, null);
  }

  _nodeToObject(node) {
    const children = {};
    for (const [name, child] of node.children.entries()) {
      children[name] = this._nodeToObject(child);
    }
    const acl = {};
    for (const [user, perm] of node.acl.entries()) {
      acl[user] = perm;
    }
    return { value: node.value, acl, children };
  }

  _objectToNode(name, obj, parent) {
    const node = new RegistryNode(name, parent, obj.value);
    for (const [user, perm] of Object.entries(obj.acl || {})) {
      node.acl.set(user, perm);
    }
    for (const [childName, childObj] of Object.entries(obj.children || {})) {
      const childNode = this._objectToNode(childName, childObj, node);
      node.children.set(childName, childNode);
    }
    return node;
  }
}

export const registry = new Registry();


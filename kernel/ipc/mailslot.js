import { objectManager } from '../executive/objectManager.js';
import { systemToken } from '../executive/security.js';

class MailSlot {
  constructor() {
    this.messages = [];
  }
  write(msg) {
    this.messages.push(msg);
  }
  read() {
    return this.messages.shift();
  }
}

export function createMailslot(path, options = {}, token = systemToken) {
  const slot = new MailSlot();
  objectManager.registerObject(path, slot, options);
  return objectManager.openHandle(path, ['read', 'write'], token);
}

export function openMailslot(path, rights = ['read', 'write'], token = systemToken) {
  return objectManager.openHandle(path, rights, token);
}

export function writeMailslot(handle, msg) {
  const slot = objectManager.getObject(handle, ['write']);
  slot.write(msg);
}

export function readMailslot(handle) {
  const slot = objectManager.getObject(handle, ['read']);
  return slot.read();
}

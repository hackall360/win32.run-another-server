import { EventEmitter } from 'events';
import { objectManager } from '../executive/objectManager.js';
import { systemToken } from '../executive/security.js';

export class LpcPort extends EventEmitter {
  constructor() {
    super();
  }

  send(message) {
    this.emit('message', message);
  }
}

export function createLpcPort(path, options = {}, token = systemToken) {
  const port = new LpcPort();
  objectManager.registerObject(path, port, options);
  return objectManager.openHandle(path, ['read', 'write'], token);
}

export function connectLpcPort(path, token = systemToken) {
  return objectManager.openHandle(path, ['read', 'write'], token);
}

export function lpcSend(handle, message) {
  const port = objectManager.getObject(handle, ['write']);
  port.send(message);
}

export function lpcOnMessage(handle, handler) {
  const port = objectManager.getObject(handle, ['read']);
  port.on('message', handler);
}

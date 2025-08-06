import { EventEmitter } from 'events';
import { objectManager } from '../executive/objectManager.js';
import { systemToken } from '../executive/security.js';

class PipeCore extends EventEmitter {
  constructor() {
    super();
    this.buffer = [];
  }

  write(data) {
    this.buffer.push(data);
    this.emit('data');
  }

  read() {
    return this.buffer.shift();
  }
}

export function createNamedPipe(path, options = {}, token = systemToken) {
  const pipe = new PipeCore();
  objectManager.registerObject(path, pipe, options);
  const readHandle = objectManager.openHandle(path, ['read'], token);
  const writeHandle = objectManager.openHandle(path, ['write'], token);
  return { readHandle, writeHandle };
}

export function openNamedPipe(path, rights = ['read', 'write'], token = systemToken) {
  return objectManager.openHandle(path, rights, token);
}

export function writePipe(handle, data) {
  const pipe = objectManager.getObject(handle, ['write']);
  pipe.write(data);
}

export function readPipe(handle) {
  const pipe = objectManager.getObject(handle, ['read']);
  return pipe.read();
}

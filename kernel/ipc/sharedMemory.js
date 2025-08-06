import { objectManager } from '../executive/objectManager.js';
import { systemToken } from '../executive/security.js';

class SharedMemory {
  constructor(size) {
    this.buffer = Buffer.alloc(size);
  }
  write(offset, data) {
    Buffer.from(data).copy(this.buffer, offset);
  }
  read(offset, length) {
    return this.buffer.slice(offset, offset + length);
  }
}

export function createSharedMemory(path, size, options = {}, token = systemToken) {
  const shm = new SharedMemory(size);
  objectManager.registerObject(path, shm, options);
  return objectManager.openHandle(path, ['read', 'write'], token);
}

export function openSharedMemory(path, rights = ['read', 'write'], token = systemToken) {
  return objectManager.openHandle(path, rights, token);
}

export function writeSharedMemory(handle, offset, data) {
  const shm = objectManager.getObject(handle, ['write']);
  shm.write(offset, data);
}

export function readSharedMemory(handle, offset, length) {
  const shm = objectManager.getObject(handle, ['read']);
  return shm.read(offset, length);
}

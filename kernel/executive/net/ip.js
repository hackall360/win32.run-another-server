import { EventEmitter } from 'events';

// Simple network interface simulation and packet router
// Each interface has an IP address and can send/receive packets

export class NetworkInterface extends EventEmitter {
  constructor(address) {
    super();
    this.address = address;
  }

  send(dest, protocol, payload) {
    sendPacket(this.address, dest, protocol, payload);
  }
}

const interfaces = new Map();

export function registerInterface(iface) {
  interfaces.set(iface.address, iface);
}

export function unregisterInterface(address) {
  interfaces.delete(address);
}

export function sendPacket(src, dest, protocol, payload) {
  const iface = interfaces.get(dest);
  if (iface) {
    iface.emit('packet', { src, dest, protocol, payload });
  }
}

// Helper used in tests to reset router state
export function _clear() {
  interfaces.clear();
}

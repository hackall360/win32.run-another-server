import { EventEmitter } from 'events';
import { sendPacket, resolveAddress } from './ip.js';

const usedPorts = new Map(); // address -> Set
let nextPort = 40000;

export class UDPSocket extends EventEmitter {
  constructor(adapter, port) {
    super();
    this.adapter = adapter;
    this.port = port;
    this._onPacket = (pkt) => {
      if (pkt.protocol === 'UDP' && pkt.payload.destPort === this.port) {
        this.emit('message', pkt.payload.data, pkt.src, pkt.payload.srcPort);
      }
    };
    adapter.on('packet', this._onPacket);
  }

  send(destAddr, destPort, data) {
    if (!resolveAddress(this.adapter.address, destAddr)) {
      return;
    }
    sendPacket(this.adapter.address, destAddr, 'UDP', {
      srcPort: this.port,
      destPort,
      data
    });
  }

  close() {
    this.adapter.off('packet', this._onPacket);
    releasePort(this.adapter.address, this.port);
  }
}

function allocPort(address) {
  let port = nextPort;
  while (isPortUsed(address, port)) port++;
  nextPort = port + 1;
  markPort(address, port);
  return port;
}

function markPort(address, port) {
  if (!usedPorts.has(address)) usedPorts.set(address, new Set());
  usedPorts.get(address).add(port);
}

function releasePort(address, port) {
  usedPorts.get(address)?.delete(port);
}

function isPortUsed(address, port) {
  return usedPorts.get(address)?.has(port);
}

export function createSocket(adapter, port) {
  const p = port ?? allocPort(adapter.address);
  if (isPortUsed(adapter.address, p) && port !== undefined) {
    throw new Error('Port already in use');
  }
  if (port !== undefined) markPort(adapter.address, p);
  return new UDPSocket(adapter, p);
}

export function _clear() {
  usedPorts.clear();
  nextPort = 40000;
}


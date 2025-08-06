import { EventEmitter } from 'events';
import { sendPacket, resolveAddress } from './ip.js';

const servers = new Map(); // key: address:port -> handler
const usedPorts = new Map(); // address -> Set of ports

function key(addr, port) {
  return `${addr}:${port}`;
}

class TCPSocket extends EventEmitter {
  constructor(adapter, localPort, remoteAddr, remotePort) {
    super();
    this.adapter = adapter;
    this.localPort = localPort;
    this.remoteAddr = remoteAddr;
    this.remotePort = remotePort;
    this.connected = false;
    this._onPacket = (pkt) => {
      if (pkt.protocol !== 'TCP') return;
      const p = pkt.payload;
      if (p.destPort !== this.localPort) return;
      if (pkt.src !== this.remoteAddr) return;
      if (p.type === 'ACCEPT') {
        this.connected = true;
        queueMicrotask(() => this.emit('connect'));
      } else if (p.type === 'DATA') {
        queueMicrotask(() => this.emit('data', p.data));
      }
    };
    adapter.on('packet', this._onPacket);
  }

  send(data) {
    if (!this.connected) return;
    sendPacket(this.adapter.address, this.remoteAddr, 'TCP', {
      type: 'DATA',
      srcPort: this.localPort,
      destPort: this.remotePort,
      data
    });
  }

  close() {
    this.adapter.off('packet', this._onPacket);
    releasePort(this.adapter.address, this.localPort);
  }
}

export function createServer(adapter, port, onConnection) {
  const serverKey = key(adapter.address, port);
  if (servers.has(serverKey) || isPortUsed(adapter.address, port)) {
    throw new Error('Port already in use');
  }
  const handler = (pkt) => {
    if (pkt.protocol !== 'TCP') return;
    const p = pkt.payload;
    if (p.destPort !== port || p.type !== 'CONNECT') return;
    const sock = new TCPSocket(adapter, port, pkt.src, p.srcPort);
    sock.connected = true;
    sendPacket(adapter.address, pkt.src, 'TCP', {
      type: 'ACCEPT',
      srcPort: port,
      destPort: p.srcPort
    });
    onConnection(sock);
  };
  adapter.on('packet', handler);
  servers.set(serverKey, handler);
  markPort(adapter.address, port);
  return {
    close() {
      adapter.off('packet', handler);
      servers.delete(serverKey);
      releasePort(adapter.address, port);
    }
  };
}

let nextPort = 40000;
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

export function connect(adapter, destAddr, destPort) {
  if (!resolveAddress(adapter.address, destAddr)) {
    throw new Error('Host unreachable');
  }
  const localPort = allocPort(adapter.address);
  const sock = new TCPSocket(adapter, localPort, destAddr, destPort);
  sendPacket(adapter.address, destAddr, 'TCP', {
    type: 'CONNECT',
    srcPort: localPort,
    destPort
  });
  return sock;
}

export { TCPSocket };

export function _clear() {
  servers.clear();
  usedPorts.clear();
  nextPort = 40000;
}


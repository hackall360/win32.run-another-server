import { EventEmitter } from 'events';
import { sendPacket } from './ip.js';

const servers = new Map(); // key: address:port -> handler

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
  }
}

export function createServer(adapter, port, onConnection) {
  const serverKey = key(adapter.address, port);
  if (servers.has(serverKey)) {
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
  return {
    close() {
      adapter.off('packet', handler);
      servers.delete(serverKey);
    }
  };
}

let nextPort = 40000;
function allocPort() {
  return nextPort++;
}

export function connect(adapter, destAddr, destPort) {
  const localPort = allocPort();
  const sock = new TCPSocket(adapter, localPort, destAddr, destPort);
  sendPacket(adapter.address, destAddr, 'TCP', {
    type: 'CONNECT',
    srcPort: localPort,
    destPort
  });
  return sock;
}

export { TCPSocket };

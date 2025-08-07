import { EventEmitter } from 'events';
import { sendPacket, resolveAddress } from './ip.js';

// Map of listening servers keyed by "address:port"
const servers = new Map();
// Track ports used per address
const usedPorts = new Map();

const RETRANSMIT_MS = 50; // retransmission timeout

function key(addr, port) {
  return `${addr}:${port}`;
}

// TCP socket implementing a very small subset of TCP with
// three-way handshake, sequence tracking and FIN teardown.
class TCPSocket extends EventEmitter {
  constructor(adapter, localPort, remoteAddr, remotePort, state = 'CLOSED') {
    super();
    this.adapter = adapter;
    this.localPort = localPort;
    this.remoteAddr = remoteAddr;
    this.remotePort = remotePort;
    this.state = state; // LISTEN, SYN_SENT, SYN_RECEIVED, ESTABLISHED, FIN_WAIT, TIME_WAIT, CLOSED
    this.sendSeq = 0;
    this.recvSeq = 0;
    this.unacked = new Map(); // seq -> { segment, length, timer }
    this._onPacket = (pkt) => this._handlePacket(pkt);
    adapter.on('packet', this._onPacket);
  }

  // Internal: schedule retransmission for a segment
  _trackSegment(seq, segment, length) {
    const timer = setTimeout(() => this._retransmit(seq), RETRANSMIT_MS);
    this.unacked.set(seq, { segment, length, timer });
  }

  _retransmit(seq) {
    const entry = this.unacked.get(seq);
    if (!entry) return;
    sendPacket(this.adapter.address, this.remoteAddr, 'TCP', entry.segment);
    entry.timer = setTimeout(() => this._retransmit(seq), RETRANSMIT_MS);
  }

  _send(flags, data) {
    let len = 0;
    if (data) {
      len = data.length;
    }
    if (flags === 'SYN' || flags === 'FIN') {
      len = 1; // SYN/FIN consume one sequence number
    }
    const seq = this.sendSeq;
    this.sendSeq += len;
    const segment = {
      type: flags,
      srcPort: this.localPort,
      destPort: this.remotePort,
      seq,
      ack: this.recvSeq
    };
    if (data) segment.data = data;
    if (flags !== 'ACK') {
      this._trackSegment(seq, segment, len);
    }
    sendPacket(this.adapter.address, this.remoteAddr, 'TCP', segment);
  }

  _ack(ackNum) {
    for (const [seq, entry] of [...this.unacked]) {
      if (seq + entry.length <= ackNum) {
        clearTimeout(entry.timer);
        this.unacked.delete(seq);
      }
    }
  }

  _handlePacket(pkt) {
    if (pkt.protocol !== 'TCP') return;
    const p = pkt.payload;
    if (p.destPort !== this.localPort) return;
    if (pkt.src !== this.remoteAddr) return;

    switch (p.type) {
      case 'SYN-ACK':
        if (this.state === 'SYN_SENT' && p.ack === this.sendSeq) {
          this._ack(p.ack);
          this.recvSeq = p.seq + 1;
          this._send('ACK');
          this.state = 'ESTABLISHED';
          queueMicrotask(() => this.emit('connect'));
        }
        break;
      case 'ACK':
        this._ack(p.ack);
        if (this.state === 'SYN_RECEIVED' && p.ack === this.sendSeq) {
          this.state = 'ESTABLISHED';
          queueMicrotask(() => this.emit('connect'));
        } else if (this.state === 'FIN_WAIT' && p.ack === this.sendSeq) {
          this.state = 'TIME_WAIT';
          setTimeout(() => this.close(), RETRANSMIT_MS * 4);
        }
        break;
      case 'DATA':
        if (p.seq === this.recvSeq) {
          this.recvSeq += p.data.length;
          this._send('ACK');
          queueMicrotask(() => this.emit('data', p.data));
        }
        break;
      case 'FIN':
        if (p.seq === this.recvSeq) {
          this.recvSeq += 1;
          this._send('ACK');
          this.state = 'TIME_WAIT';
          setTimeout(() => this.close(), RETRANSMIT_MS * 4);
        }
        break;
      case 'SYN':
        // should not occur here; listeners handle SYN packets
        break;
    }
  }

  send(data, options = {}) {
    if (this.state !== 'ESTABLISHED' && this.state !== 'SYN_RECEIVED') return;
    this._send('DATA', data);
    if (options.async && options.completionPort) {
      setImmediate(() => options.completionPort.post(this, { operation: 'send' }));
    }
  }

  close() {
    if (this.state === 'ESTABLISHED') {
      this._send('FIN');
      this.state = 'FIN_WAIT';
      return;
    }
    this.adapter.off('packet', this._onPacket);
    for (const entry of this.unacked.values()) clearTimeout(entry.timer);
    this.unacked.clear();
    releasePort(this.adapter.address, this.localPort);
    this.state = 'CLOSED';
    queueMicrotask(() => this.emit('close'));
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
    if (p.destPort !== port || p.type !== 'SYN') return;
    const sock = new TCPSocket(adapter, port, pkt.src, p.srcPort, 'SYN_RECEIVED');
    sock.recvSeq = p.seq + 1;
    sock.sendSeq = 0;
    onConnection(sock);
    queueMicrotask(() => sock._send('SYN-ACK'));
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

export function connect(adapter, destAddr, destPort, options = {}) {
  if (!resolveAddress(adapter.address, destAddr)) {
    throw new Error('Host unreachable');
  }
  const localPort = allocPort(adapter.address);
  const sock = new TCPSocket(adapter, localPort, destAddr, destPort, 'SYN_SENT');
  sock.sendSeq = 0;
  sock._send('SYN');
  if (options.completionPort) {
    sock.on('connect', () => options.completionPort.post(sock, { operation: 'connect' }));
  }
  return sock;
}

export { TCPSocket };

export function _clear() {
  servers.clear();
  usedPorts.clear();
  nextPort = 40000;
}


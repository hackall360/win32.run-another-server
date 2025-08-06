import { createSocket as createUDPSocket } from './udp.js';
import { createServer as createTCPServer, connect as tcpConnect } from './tcp.js';

export class Socket {
  constructor(type, adapter) {
    this.type = type;
    this.adapter = adapter;
    this.port = null;
    this.impl = null;
    this.server = null;
  }

  bind(port) {
    this.port = port;
    if (this.type === 'udp') {
      this.impl = createUDPSocket(this.adapter, port);
    }
  }

  listen(handler) {
    if (this.type !== 'tcp') {
      throw new Error('listen only valid for TCP sockets');
    }
    this.server = createTCPServer(this.adapter, this.port, (sock) => {
      handler(new WrappedTCPSocket(sock));
    });
  }

  connect(addr, port) {
    if (this.type !== 'tcp') {
      throw new Error('connect only valid for TCP sockets');
    }
    this.impl = tcpConnect(this.adapter, addr, port);
    return new WrappedTCPSocket(this.impl);
  }

  send(...args) {
    if (this.type === 'udp') {
      const [addr, port, data] = args;
      this.impl.send(addr, port, data);
    } else if (this.type === 'tcp') {
      const [data] = args;
      this.impl.send(data);
    }
  }

  on(event, handler) {
    this.impl.on(event, handler);
  }

  close() {
    this.impl?.close?.();
    this.server?.close?.();
  }
}

class WrappedTCPSocket {
  constructor(sock) {
    this.sock = sock;
  }
  send(data) { this.sock.send(data); }
  on(ev, h) { this.sock.on(ev, h); }
  close() { this.sock.close(); }
}

export default function socket(options) {
  const { type, adapter } = options;
  return new Socket(type, adapter);
}

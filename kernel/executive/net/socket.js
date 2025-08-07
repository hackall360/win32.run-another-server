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

  listen(handler, options = {}) {
    if (this.type !== 'tcp') {
      throw new Error('listen only valid for TCP sockets');
    }
    this.server = createTCPServer(this.adapter, this.port, (sock) => {
      const wrapped = new WrappedTCPSocket(sock);
      handler(wrapped);
      if (options.completionPort) {
        options.completionPort.post(wrapped, { operation: 'accept' });
      }
    });
  }

  connect(addr, port, options = {}) {
    if (this.type !== 'tcp') {
      throw new Error('connect only valid for TCP sockets');
    }
    this.impl = tcpConnect(this.adapter, addr, port);
    const wrapped = new WrappedTCPSocket(this.impl);
    if (options.completionPort) {
      this.impl.on('connect', () => {
        options.completionPort.post(wrapped, { operation: 'connect' });
      });
    }
    return wrapped;
  }

  send(...args) {
    let options = {};
    if (args.length && typeof args[args.length - 1] === 'object' &&
        (args[args.length - 1].async || args[args.length - 1].completionPort)) {
      options = args.pop();
    }
    if (this.type === 'udp') {
      const [addr, port, data] = args;
      this.impl.send(addr, port, data);
    } else if (this.type === 'tcp') {
      const [data] = args;
      this.impl.send(data);
    }
    if (options.async && options.completionPort) {
      setImmediate(() => options.completionPort.post(this, { operation: 'send' }));
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
  send(data, options = {}) {
    this.sock.send(data);
    if (options.async && options.completionPort) {
      setImmediate(() => options.completionPort.post(this, { operation: 'send' }));
    }
  }
  on(ev, h) { this.sock.on(ev, h); }
  close() { this.sock.close(); }
}

export default function socket(options) {
  const { type, adapter } = options;
  return new Socket(type, adapter);
}

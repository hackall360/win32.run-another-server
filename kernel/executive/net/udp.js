import { EventEmitter } from 'events';
import { sendPacket } from './ip.js';

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
    sendPacket(this.adapter.address, destAddr, 'UDP', {
      srcPort: this.port,
      destPort,
      data
    });
  }

  close() {
    this.adapter.off('packet', this._onPacket);
  }
}

export function createSocket(adapter, port) {
  return new UDPSocket(adapter, port);
}

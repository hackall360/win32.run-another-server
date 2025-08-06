import { EventEmitter } from 'events';

// Network segment containing an ARP table mapping IP -> interface
export class NetworkSegment {
  constructor() {
    this.arp = new Map();
  }
}

const defaultSegment = new NetworkSegment();

// Simple network interface simulation and packet router
// Each interface has an IP address, belongs to a network segment and may be
// part of a multi-homed device (used for routing).

export class NetworkInterface extends EventEmitter {
  constructor(address, segment = defaultSegment, device = { interfaces: [] }) {
    super();
    this.address = address;
    this.segment = segment;
    this.device = device;
    device.interfaces.push(this);
    segment.arp.set(address, this);
  }

  send(dest, protocol, payload) {
    sendPacket(this.address, dest, protocol, payload);
  }
}

const interfaces = new Map();

export function registerInterface(iface) {
  interfaces.set(iface.address, iface);
  if (iface.segment) {
    iface.segment.arp.set(iface.address, iface);
  }
}

export function unregisterInterface(address) {
  const iface = interfaces.get(address);
  if (iface && iface.segment) {
    iface.segment.arp.delete(address);
  }
  interfaces.delete(address);
}

// Resolve a destination IP from the perspective of a source interface.
// Uses ARP lookups on local segments and traverses connected devices to find
// multi-hop routes.
export function resolveAddress(srcAddr, destAddr, visitedSegments = new Set(), visitedDevices = new Set()) {
  const srcIface = interfaces.get(srcAddr);
  if (!srcIface) return null;
  return _resolveFrom(srcIface, destAddr, visitedSegments, visitedDevices);
}

function _resolveFrom(iface, destAddr, visitedSegments, visitedDevices) {
  const segment = iface.segment;
  if (!segment || visitedSegments.has(segment)) return null;
  visitedSegments.add(segment);

  const direct = segment.arp.get(destAddr);
  if (direct) return direct;

  for (const segIface of segment.arp.values()) {
    const device = segIface.device;
    if (!device || visitedDevices.has(device)) continue;
    visitedDevices.add(device);
    for (const other of device.interfaces) {
      if (other === segIface) continue;
      const res = _resolveFrom(other, destAddr, visitedSegments, visitedDevices);
      if (res) return res;
    }
  }
  return null;
}

export function sendPacket(src, dest, protocol, payload) {
  const iface = resolveAddress(src, dest);
  if (iface) {
    iface.emit('packet', { src, dest, protocol, payload });
  }
}

// Helper used in tests to reset router state
export function _clear() {
  interfaces.clear();
  defaultSegment.arp.clear();
}

export { interfaces };

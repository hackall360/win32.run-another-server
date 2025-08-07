import { EventEmitter } from 'events';

// Shared utility to schedule periodic cleanup of timestamped map entries
function scheduleCleanup(map, ttl) {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (now - entry.ts > ttl) {
        map.delete(key);
      }
    }
  }, ttl);
  timer.unref();
  return timer;
}

// Default TTL for ARP and route cache entries (ms)
const DEFAULT_TTL = 30_000;

// Network segment containing an ARP table mapping IP -> interface
export class NetworkSegment {
  constructor({ arpTTL = DEFAULT_TTL } = {}) {
    this.arpTTL = arpTTL;
    this.arp = new Map();
    this._cleanup = scheduleCleanup(this.arp, this.arpTTL);
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
    arpSet(segment, address, this);
  }

  send(dest, protocol, payload) {
    sendPacket(this.address, dest, protocol, payload);
  }
}

const interfaces = new Map();

// Cache for resolved next-hop lookups
const routeCache = new Map();
scheduleCleanup(routeCache, DEFAULT_TTL);

function arpSet(segment, address, iface) {
  segment.arp.set(address, { iface, ts: Date.now() });
}

export function registerInterface(iface) {
  interfaces.set(iface.address, iface);
  if (iface.segment) {
    arpSet(iface.segment, iface.address, iface);
  }
}

export function unregisterInterface(address) {
  const iface = interfaces.get(address);
  if (iface && iface.segment) {
    iface.segment.arp.delete(address);
  }
  interfaces.delete(address);

  // remove any cached routes involving this interface
  for (const [key, entry] of routeCache) {
    if (entry.iface.address === address || key.startsWith(`${address}->`) || key.endsWith(`->${address}`)) {
      routeCache.delete(key);
    }
  }
}

// Resolve a destination IP from the perspective of a source interface.
// Uses ARP lookups on local segments and traverses connected devices to find
// multi-hop routes.
export function resolveAddress(srcAddr, destAddr, visitedSegments = new Set(), visitedDevices = new Set()) {
  const srcIface = interfaces.get(srcAddr);
  if (!srcIface) return null;

  const key = `${srcAddr}->${destAddr}`;
  const now = Date.now();
  const cached = routeCache.get(key);
  if (cached && now - cached.ts <= DEFAULT_TTL) {
    cached.ts = now; // refresh TTL
    return cached.iface;
  }

  const res = _resolveFrom(srcIface, destAddr, visitedSegments, visitedDevices);
  if (res) {
    routeCache.set(key, { iface: res, ts: now });
  }
  return res;
}

function _resolveFrom(iface, destAddr, visitedSegments, visitedDevices) {
  const segment = iface.segment;
  if (!segment || visitedSegments.has(segment)) return null;
  visitedSegments.add(segment);

  const direct = segment.arp.get(destAddr);
  if (direct) {
    direct.ts = Date.now();
    return direct.iface;
  }

  for (const entry of segment.arp.values()) {
    const segIface = entry.iface;
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
  routeCache.clear();
}

export { interfaces, routeCache as _routeCache };

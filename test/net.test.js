import { test } from 'node:test';
import assert from 'node:assert';
import { NetworkInterface, NetworkSegment, registerInterface, resolveAddress, _clear } from '../kernel/executive/net/ip.js';
import * as ip from '../kernel/executive/net/ip.js';
import { createSocket as createUDPSocket, _clear as clearUDP } from '../kernel/executive/net/udp.js';
import { createServer, connect, _clear as clearTCP } from '../kernel/executive/net/tcp.js';
import socket from '../kernel/executive/net/socket.js';

function setupAdapters() {
  _clear();
  clearUDP();
  clearTCP();
  const seg = new NetworkSegment();
  const a = new NetworkInterface('10.0.0.1', seg);
  const b = new NetworkInterface('10.0.0.2', seg);
  registerInterface(a);
  registerInterface(b);
  return { a, b, seg };
}

test('UDP packets route between interfaces', async () => {
  const { a, b } = setupAdapters();
  const sockB = createUDPSocket(b, 5000);
  const sockA = createUDPSocket(a, 4000);

  const received = new Promise((resolve) => {
    sockB.on('message', (data, src) => {
      assert.strictEqual(src, '10.0.0.1');
      assert.strictEqual(data.toString(), 'hello');
      resolve();
    });
  });

  sockA.send('10.0.0.2', 5000, Buffer.from('hello'));
  await received;
  sockA.close();
  sockB.close();
});

test('TCP connection and data transfer', async () => {
  const { a, b } = setupAdapters();
  let serverConn;
  const server = createServer(b, 8080, (sock) => {
    serverConn = sock;
    sock.on('data', (d) => {
      assert.strictEqual(d.toString(), 'ping');
      sock.send('pong');
    });
  });

  const client = connect(a, '10.0.0.2', 8080);
  await new Promise((res) => client.on('connect', res));
  await new Promise((r) => setTimeout(r, 5));

  let response;
  client.on('data', (d) => { response = d.toString(); });
  client.send('ping');
  await new Promise((r) => setTimeout(r, 10));
  assert.strictEqual(response, 'pong');
  client.close();
  serverConn.close();
  server.close();
});

test('TCP retransmits lost SYN-ACK', async () => {
  const { a, b } = setupAdapters();
  let drop = true;
  const originalEmit = a.emit.bind(a);
  a.emit = (ev, pkt) => {
    if (drop && ev === 'packet' && pkt.protocol === 'TCP' && pkt.payload.type === 'SYN-ACK') {
      drop = false; // drop first SYN-ACK
      return;
    }
    return originalEmit(ev, pkt);
  };

  let serverConn;
  const server = createServer(b, 8110, (sock) => { serverConn = sock; });
  const client = connect(a, '10.0.0.2', 8110);
  await new Promise((res) => client.on('connect', res));

  a.emit = originalEmit;
  client.close();
  serverConn.close();
  server.close();
});

test('socket.js provides unified API', async () => {
  const { a, b } = setupAdapters();
  const serverSock = socket({ type: 'tcp', adapter: b });
  serverSock.bind(9090);
  let serverConn;
  serverSock.listen((conn) => {
    serverConn = conn;
    conn.on('data', (d) => conn.send(d));
  });

  const clientSock = socket({ type: 'tcp', adapter: a });
  const conn = clientSock.connect('10.0.0.2', 9090);
  await new Promise((r) => conn.on('connect', r));
  await new Promise((r) => setTimeout(r, 5));
  let echo;
  conn.on('data', (d) => { echo = d.toString(); });
  conn.send('echo');
  await new Promise((r) => setTimeout(r, 10));
  assert.strictEqual(echo, 'echo');
  conn.close();
  serverSock.close();
});

test('ARP resolution finds local peers', () => {
  const { a, b } = setupAdapters();
  const resolved = resolveAddress(a.address, b.address);
  assert.strictEqual(resolved, b);
  assert.strictEqual(resolveAddress(a.address, '10.0.0.99'), null);
});

test('ARP entries expire after TTL', async () => {
  _clear();
  const seg = new NetworkSegment({ arpTTL: 5 });
  const a = new NetworkInterface('10.0.0.1', seg);
  registerInterface(a);
  assert.ok(seg.arp.has('10.0.0.1'));
  await new Promise((r) => setTimeout(r, 15));
  assert.ok(!seg.arp.has('10.0.0.1'));
});

test('resolveAddress caches next-hop lookups', () => {
  const { a, b } = setupAdapters();
  ip._routeCache.clear();
  const key = `${a.address}->${b.address}`;
  const first = resolveAddress(a.address, b.address);
  assert.ok(ip._routeCache.has(key));
  const firstTs = ip._routeCache.get(key).ts;
  const second = resolveAddress(a.address, b.address);
  const secondTs = ip._routeCache.get(key).ts;
  assert.strictEqual(second, first);
  assert.ok(secondTs >= firstTs);
});

test('multi-hop packet delivery via routers', async () => {
  _clear();
  const seg1 = new NetworkSegment();
  const seg2 = new NetworkSegment();
  const seg3 = new NetworkSegment();

  // Hosts
  const hostA = new NetworkInterface('10.0.0.1', seg1);
  const hostC = new NetworkInterface('10.0.2.1', seg3);

  // Router 1 between seg1 and seg2
  const r1 = { interfaces: [] };
  const r1a = new NetworkInterface('10.0.0.254', seg1, r1);
  const r1b = new NetworkInterface('10.0.1.1', seg2, r1);

  // Router 2 between seg2 and seg3
  const r2 = { interfaces: [] };
  const r2a = new NetworkInterface('10.0.1.2', seg2, r2);
  const r2b = new NetworkInterface('10.0.2.254', seg3, r2);

  [hostA, hostC, r1a, r1b, r2a, r2b].forEach(registerInterface);

  const sockC = createUDPSocket(hostC, 6000);
  const sockA = createUDPSocket(hostA, 5000);

  const received = new Promise((resolve) => {
    sockC.on('message', (data, src) => {
      assert.strictEqual(src, '10.0.0.1');
      assert.strictEqual(data.toString(), 'multi');
      resolve();
    });
  });

  sockA.send('10.0.2.1', 6000, Buffer.from('multi'));
  await received;
  sockA.close();
  sockC.close();
});

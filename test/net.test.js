import { test } from 'node:test';
import assert from 'node:assert';
import { NetworkInterface, registerInterface, _clear } from '../kernel/executive/net/ip.js';
import { createSocket as createUDPSocket } from '../kernel/executive/net/udp.js';
import { createServer, connect } from '../kernel/executive/net/tcp.js';
import socket from '../kernel/executive/net/socket.js';

function setupAdapters() {
  _clear();
  const a = new NetworkInterface('10.0.0.1');
  const b = new NetworkInterface('10.0.0.2');
  registerInterface(a);
  registerInterface(b);
  return { a, b };
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

  let response;
  client.on('data', (d) => { response = d.toString(); });
  client.send('ping');
  await new Promise((r) => setTimeout(r, 10));
  assert.strictEqual(response, 'pong');
  client.close();
  serverConn.close();
  server.close();
});

test('socket.js provides unified API', async () => {
  const { a, b } = setupAdapters();
  const serverSock = socket({ type: 'tcp', adapter: b });
  serverSock.bind(9090);
  serverSock.listen((conn) => {
    conn.on('data', (d) => conn.send(d));
  });

  const clientSock = socket({ type: 'tcp', adapter: a });
  const conn = clientSock.connect('10.0.0.2', 9090);
  await new Promise((r) => conn.on('connect', r));
  let echo;
  conn.on('data', (d) => { echo = d.toString(); });
  conn.send('echo');
  await new Promise((r) => setTimeout(r, 10));
  assert.strictEqual(echo, 'echo');
  conn.close();
  serverSock.close();
});

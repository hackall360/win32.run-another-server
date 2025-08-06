import { test } from 'node:test';
import assert from 'node:assert';
import bootstrap from '../kernel/bootstrap.js';
import { NetworkInterface, registerInterface, _clear } from '../kernel/executive/net/ip.js';
import { createSocket as createUDPSocket } from '../kernel/executive/net/udp.js';
import { Thread } from '../kernel/thread.js';

// Integration test: processes performing I/O and network operations through scheduler

test('processes perform I/O and network operations', async () => {
  const { scheduler, deviceManager } = await bootstrap();
  _clear();
  const ifaceA = new NetworkInterface('10.0.0.1');
  const ifaceB = new NetworkInterface('10.0.0.2');
  registerInterface(ifaceA);
  registerInterface(ifaceB);

  let received = '';
  const recvProc = scheduler.createProcess(1);
  const recvThread = new Thread(async () => {
    const sock = createUDPSocket(ifaceB, 5000);
    await new Promise(resolve => {
      sock.on('message', (data) => { received = data.toString(); resolve(); });
    });
  });
  recvProc.addThread(recvThread);

  const sendProc = scheduler.createProcess(1);
  const sendThread = new Thread(async () => {
    const result = deviceManager.sendRequest('storage', 'read');
    assert.strictEqual(result, 'storage:read');
    const sock = createUDPSocket(ifaceA, 4000);
    sock.send('10.0.0.2', 5000, Buffer.from('hello'));
  });
  sendProc.addThread(sendThread);

  scheduler.contextSwitch(recvProc);
  const recvPromise = recvThread.start();
  scheduler.contextSwitch(sendProc);
  await sendThread.start();
  await recvPromise;
  assert.strictEqual(received, 'hello');
});

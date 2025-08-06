import { test } from 'node:test';
import assert from 'node:assert';
import { eventLog, logEvent, logError } from '../system/eventLog.js';
import { crashDump, createCrashDump } from '../system/crashDump.js';

test('event log records info and error entries', () => {
  eventLog.clear();
  logEvent('test_info', { a: 1 });
  logError('test_error', new Error('boom'));
  const events = eventLog.getEvents();
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[0].type, 'info');
  assert.strictEqual(events[1].type, 'error');
});

test('crash dump stores dumps', () => {
  crashDump.clear();
  createCrashDump('test_dump', { x: 1 });
  const dumps = crashDump.getDumps();
  assert.strictEqual(dumps.length, 1);
  assert.strictEqual(dumps[0].reason, 'test_dump');
});

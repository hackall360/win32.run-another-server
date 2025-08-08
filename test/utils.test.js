import { test } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { includes, click_outside } from '../src/lib/utils.js';

test('includes handles primitive values', () => {
  assert.strictEqual(includes(2, [1, 2, 3]), true);
  assert.strictEqual(includes(NaN, [NaN]), true);
  assert.strictEqual(includes(4, [1, 2, 3]), false);
});

test('includes works with objects without equals method', () => {
  const obj = { a: 1 };
  const arr = [obj];
  assert.strictEqual(includes(obj, arr), true);
  assert.strictEqual(includes({ a: 1 }, arr), false);
});

test('click_outside dispatches node in event.detail', () => {
  const dom = new JSDOM('<!DOCTYPE html><div id="node"></div><div id="outside"></div>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;

  const node = document.getElementById('node');
  const outside = document.getElementById('outside');

  const action = click_outside(node);

  let received = null;
  node.addEventListener('click_outside', (event) => {
    received = event.detail;
  });

  outside.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  assert.strictEqual(received, node);

  action.destroy();

  delete global.window;
  delete global.document;
  delete global.CustomEvent;
});

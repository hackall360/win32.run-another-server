import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import { tooltip } from '../src/lib/components/xp/tooltip.js';

test('script tags in tooltip attribute are neutralized', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.HTMLElement = window.HTMLElement;
  global.Event = window.Event;
  global.MouseEvent = window.MouseEvent;

  const element = document.createElement('div');
  const scriptContent = '<script>globalThis.evil = true</script>';
  element.setAttribute('tooltip', scriptContent);
  document.body.appendChild(element);

  tooltip(element);
  element.dispatchEvent(new window.Event('mouseenter'));

  await new Promise((r) => setTimeout(r, 2100));

  const tooltipDiv = document.body.lastElementChild;
  const paragraph = tooltipDiv.querySelector('p');
  assert.equal(paragraph.textContent, scriptContent);
  assert.equal(document.querySelector('script'), null);
  assert.equal(globalThis.evil, undefined);
});

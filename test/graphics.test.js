import { test } from 'node:test';
import assert from 'node:assert';
import { createSurface, createDeviceContext } from '../kernel/executive/graphics/gdi.js';

function rgbaEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

test('line draws on surface', () => {
  const s = createSurface(10, 10, 'software');
  const dc = createDeviceContext(s);
  dc.line(0, 0, 9, 9, '#ff0000');
  const p = s.getPixel(5, 5);
  assert(rgbaEqual(p, [255, 0, 0, 255]));
});

test('rectangle draws border', () => {
  const s = createSurface(10, 10, 'software');
  const dc = createDeviceContext(s);
  dc.rect(1, 1, 8, 8, '#00ff00');
  assert(rgbaEqual(s.getPixel(1, 1), [0, 255, 0, 255]));
  assert(rgbaEqual(s.getPixel(8, 1), [0, 255, 0, 255]));
  assert(rgbaEqual(s.getPixel(1, 8), [0, 255, 0, 255]));
});

test('blit copies pixels between surfaces', () => {
  const src = createSurface(5, 5, 'software');
  const dcs = createDeviceContext(src);
  dcs.rect(0, 0, 5, 5, '#0000ff', true);
  const dst = createSurface(5, 5, 'software');
  const dcd = createDeviceContext(dst);
  dcd.blit(src, 0, 0, 5, 5, 0, 0);
  assert(rgbaEqual(dst.getPixel(2, 2), [0, 0, 255, 255]));
});

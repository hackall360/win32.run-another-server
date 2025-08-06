import { Surface } from './surface.js';
import { DeviceContext } from './deviceContext.js';

export function createSurface(width, height, backend = 'canvas') {
  return new Surface(width, height, backend);
}

export function createDeviceContext(surface) {
  return new DeviceContext(surface);
}

export { Surface, DeviceContext };

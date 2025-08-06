export class Surface {
  constructor(width, height, backend = 'canvas') {
    this.width = width;
    this.height = height;
    this.backend = backend;

    // Try canvas or webgl backends if environment supports them
    if (backend === 'webgl' && typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(width, height);
      this.gl =
        this.canvas.getContext('webgl') ||
        this.canvas.getContext('webgl2');
      if (!this.gl) {
        // Fallback to 2d canvas if WebGL not available
        this.ctx = this.canvas.getContext('2d');
        this.backend = 'canvas';
      }
    } else if (backend === 'canvas' && typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(width, height);
      this.ctx = this.canvas.getContext('2d');
    }

    if (!this.canvas) {
      // Software fallback using raw pixel buffer
      this.backend = 'software';
      this.buffer = new Uint8ClampedArray(width * height * 4);
    }
  }

  // Utility for software buffer
  _index(x, y) {
    return (y * this.width + x) * 4;
  }

  setPixel(x, y, rgba) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    if (this.backend === 'software') {
      const idx = this._index(x, y);
      const [r, g, b, a] = rgba;
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = a;
    } else if (this.ctx) {
      const [r, g, b, a] = rgba;
      const image = new Uint8ClampedArray([r, g, b, a]);
      const data = new ImageData(image, 1, 1);
      this.ctx.putImageData(data, x, y);
    } else if (this.gl) {
      // WebGL single pixel draw using scissor + clear
      const [r, g, b, a] = rgba.map(v => v / 255);
      this.gl.enable(this.gl.SCISSOR_TEST);
      this.gl.scissor(x, this.height - y - 1, 1, 1);
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.disable(this.gl.SCISSOR_TEST);
    }
  }

  getPixel(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return [0, 0, 0, 0];
    if (this.backend === 'software') {
      const idx = this._index(x, y);
      return [
        this.buffer[idx],
        this.buffer[idx + 1],
        this.buffer[idx + 2],
        this.buffer[idx + 3]
      ];
    } else if (this.ctx) {
      const data = this.ctx.getImageData(x, y, 1, 1).data;
      return [data[0], data[1], data[2], data[3]];
    } else if (this.gl) {
      const pixel = new Uint8Array(4);
      this.gl.readPixels(x, this.height - y - 1, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
      return [pixel[0], pixel[1], pixel[2], pixel[3]];
    }
    return [0, 0, 0, 0];
  }
}

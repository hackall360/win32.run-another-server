import { Surface } from './surface.js';

function colorToRGBA(color) {
  if (Array.isArray(color)) return color;
  if (typeof color === 'string') {
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      if (hex.length === 6) hex += 'ff';
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16);
      return [r, g, b, a];
    }
  }
  return [0, 0, 0, 255];
}

export class DeviceContext {
  constructor(surface) {
    if (!(surface instanceof Surface)) throw new Error('DC requires Surface');
    this.surface = surface;
    if (surface.gl) {
      this._initGL();
    }
  }

  _initGL() {
    const gl = this.surface.gl;
    // Simple shader for colored primitives
    const vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert, `
      attribute vec2 aPos;
      uniform vec2 uResolution;
      void main() {
        vec2 zeroToOne = aPos / uResolution;
        vec2 clip = zeroToOne * 2.0 - 1.0;
        gl_Position = vec4(clip * vec2(1, -1), 0, 1);
      }
    `);
    gl.compileShader(vert);

    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag, `
      precision mediump float;
      uniform vec4 uColor;
      void main() { gl_FragColor = uColor; }
    `);
    gl.compileShader(frag);

    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);

    this.glProg = prog;
    this.aPos = gl.getAttribLocation(prog, 'aPos');
    this.uResolution = gl.getUniformLocation(prog, 'uResolution');
    this.uColor = gl.getUniformLocation(prog, 'uColor');
    this.buf = gl.createBuffer();
  }

  line(x1, y1, x2, y2, color = '#000') {
    const rgba = colorToRGBA(color);
    if (this.surface.ctx) {
      const ctx = this.surface.ctx;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1 + 0.5, y1 + 0.5);
      ctx.lineTo(x2 + 0.5, y2 + 0.5);
      ctx.stroke();
    } else if (this.surface.gl) {
      const gl = this.surface.gl;
      gl.useProgram(this.glProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      const verts = new Float32Array([x1, y1, x2, y2]);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(this.uResolution, this.surface.width, this.surface.height);
      gl.uniform4f(this.uColor, rgba[0]/255, rgba[1]/255, rgba[2]/255, rgba[3]/255);
      gl.drawArrays(gl.LINES, 0, 2);
    } else {
      // software backend
      this._lineSoftware(x1, y1, x2, y2, rgba);
    }
  }

  rect(x, y, w, h, color = '#000', fill = false) {
    const rgba = colorToRGBA(color);
    if (this.surface.ctx) {
      const ctx = this.surface.ctx;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      if (fill) ctx.fillRect(x, y, w, h);
      else ctx.strokeRect(x, y, w, h);
    } else if (this.surface.gl) {
      if (fill) {
        // Draw two triangles
        const gl = this.surface.gl;
        gl.useProgram(this.glProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
        const verts = new Float32Array([
          x, y, x + w, y, x, y + h, x + w, y + h
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(this.uResolution, this.surface.width, this.surface.height);
        gl.uniform4f(this.uColor, rgba[0]/255, rgba[1]/255, rgba[2]/255, rgba[3]/255);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else {
        const gl = this.surface.gl;
        gl.useProgram(this.glProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
        const verts = new Float32Array([
          x, y, x + w, y, x + w, y + h, x, y + h
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(this.uResolution, this.surface.width, this.surface.height);
        gl.uniform4f(this.uColor, rgba[0]/255, rgba[1]/255, rgba[2]/255, rgba[3]/255);
        gl.drawArrays(gl.LINE_LOOP, 0, 4);
      }
    } else {
      this._rectSoftware(x, y, w, h, rgba, fill);
    }
  }

  blit(srcSurface, sx = 0, sy = 0, sw = srcSurface.width, sh = srcSurface.height, dx = 0, dy = 0) {
    if (this.surface.ctx && srcSurface.canvas) {
      this.surface.ctx.drawImage(srcSurface.canvas, sx, sy, sw, sh, dx, dy, sw, sh);
    } else if (this.surface.gl) {
      // Simple WebGL blit using tex + quad
      const gl = this.surface.gl;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      if (srcSurface.gl) {
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sx, sy, sw, sh, 0);
      } else if (srcSurface.ctx) {
        const data = srcSurface.ctx.getImageData(sx, sy, sw, sh).data;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      } else {
        const data = new Uint8Array(srcSurface.buffer.buffer, srcSurface._index(sx, sy), sw * sh * 4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      }

      const vert = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vert, `
        attribute vec2 aPos;
        attribute vec2 aTex;
        uniform vec2 uResolution;
        varying vec2 vTex;
        void main() {
          vec2 zeroToOne = aPos / uResolution;
          vec2 clip = zeroToOne * 2.0 - 1.0;
          gl_Position = vec4(clip * vec2(1,-1), 0, 1);
          vTex = aTex;
        }
      `);
      gl.compileShader(vert);
      const frag = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(frag, `
        precision mediump float;
        uniform sampler2D uImg;
        varying vec2 vTex;
        void main() { gl_FragColor = texture2D(uImg, vTex); }
      `);
      gl.compileShader(frag);
      const prog = gl.createProgram();
      gl.attachShader(prog, vert);
      gl.attachShader(prog, frag);
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const aPos = gl.getAttribLocation(prog, 'aPos');
      const aTex = gl.getAttribLocation(prog, 'aTex');
      const uResolution = gl.getUniformLocation(prog, 'uResolution');
      gl.uniform2f(uResolution, this.surface.width, this.surface.height);

      const verts = new Float32Array([
        dx, dy, 0, 0,
        dx + sw, dy, 1, 0,
        dx, dy + sh, 0, 1,
        dx + sw, dy + sh, 1, 1
      ]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aTex);
      gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    } else {
      // software backend
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const pixel = srcSurface.getPixel(sx + x, sy + y);
          this.surface.setPixel(dx + x, dy + y, pixel);
        }
      }
    }
  }

  // Software implementations
  _lineSoftware(x0, y0, x1, y1, rgba) {
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;
    while (true) {
      this.surface.setPixel(x0, y0, rgba);
      if (x0 === x1 && y0 === y1) break;
      e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  _rectSoftware(x, y, w, h, rgba, fill) {
    if (fill) {
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          this.surface.setPixel(x + xx, y + yy, rgba);
        }
      }
    } else {
      for (let xx = 0; xx < w; xx++) {
        this.surface.setPixel(x + xx, y, rgba);
        this.surface.setPixel(x + xx, y + h - 1, rgba);
      }
      for (let yy = 0; yy < h; yy++) {
        this.surface.setPixel(x, y + yy, rgba);
        this.surface.setPixel(x + w - 1, y + yy, rgba);
      }
    }
  }
}

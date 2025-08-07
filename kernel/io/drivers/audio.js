import Driver from './base.js';

export class AudioDriver extends Driver {
  constructor() {
    super('audio', 'IRQ_AUDIO');
    this.requests = [];
  }

  handleRequest(request) {
    this.requests.push(request);
    if (request?.type === 'tone') {
      return this.playTone(request.freq, request.duration);
    }
    if (request?.type === 'buffer') {
      return this.playBuffer(request.buffer);
    }
    // Unknown request type
    return null;
  }

  playTone(freq, duration) {
    return `audio:tone:${freq}:${duration}`;
  }

  playBuffer(buffer) {
    return `audio:buffer:${buffer?.length ?? 0}`;
  }
}

export default AudioDriver;

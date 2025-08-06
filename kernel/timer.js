import { timer } from '../src/lib/hal/index.js';
import { KernelEvent } from './event.js';

export class KernelTimer extends KernelEvent {
  constructor(timeoutMs, scheduler = null) {
    super(false, scheduler);
    this.timeoutId = timer.setTimeout(() => {
      this.signaled = true;
      if (this.scheduler) {
        this.scheduler.onObjectSignaled(this);
      }
    }, timeoutMs);
  }

  cancel() {
    if (this.timeoutId !== null) {
      timer.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

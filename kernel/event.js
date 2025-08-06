export class KernelEvent {
  constructor(initialState = false, scheduler = null) {
    this.signaled = initialState;
    this.scheduler = scheduler;
  }

  set() {
    this.signaled = true;
    if (this.scheduler) {
      this.scheduler.onObjectSignaled(this);
    }
  }

  reset() {
    this.signaled = false;
  }
}

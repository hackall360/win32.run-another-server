import { THREAD_SYSCALLS } from '../system/syscall.js';

let nextTid = 1;
const threadTable = new Map();
let schedulerRef;

export class Thread {
  constructor(entry, scheduler = null) {
    this.tid = nextTid++;
    this.entry = entry;
    this.state = 'ready';
    this.context = { registers: {}, sp: 0 };
    this.scheduler = scheduler;
    this.preferredCpu = 0;
  }

  saveContext(ctx) {
    this.context = { ...ctx };
  }

  loadContext() {
    return { ...this.context };
  }

  async start(...args) {
    this.state = 'running';
    try {
      return await this.entry(...args);
    } finally {
      this.state = 'terminated';
    }
  }

  wait(object, timeout, alertable = false) {
    if (!this.scheduler) {
      throw new Error('Thread has no scheduler');
    }
    return this.scheduler.blockThread(this, object, timeout, alertable);
  }
}

export function createThread(startRoutine, param, creationFlags = 0) {
  const thread = new Thread(() => startRoutine(param), schedulerRef);
  const proc = schedulerRef.current;
  if (!proc) {
    throw new Error('No current process');
  }
  proc.addThread(thread);
  threadTable.set(thread.tid, { thread, process: proc });

  if (!(creationFlags & 0x1)) {
    Promise.resolve()
      .then(() => thread.start())
      .catch(err => console.error('Thread start error', err));
  } else {
    thread.state = 'suspended';
  }
  return thread.tid;
}

export function suspendThread(tid) {
  const record = threadTable.get(tid);
  if (!record) {
    return -1;
  }
  if (record.thread.state === 'running' || record.thread.state === 'ready') {
    record.thread.state = 'suspended';
  }
  return 0;
}

export function resumeThread(tid) {
  const record = threadTable.get(tid);
  if (!record) {
    return -1;
  }
  if (record.thread.state === 'suspended') {
    record.thread.state = 'ready';
    Promise.resolve()
      .then(() => record.thread.start())
      .catch(err => console.error('Thread start error', err));
  }
  return 0;
}

export function exitThread(code = 0) {
  const proc = schedulerRef.current;
  if (!proc || proc.threads.length === 0) {
    return code;
  }
  const thread = proc.threads[0];
  thread.state = 'terminated';
  threadTable.delete(thread.tid);
  const idx = proc.threads.indexOf(thread);
  if (idx !== -1) {
    proc.threads.splice(idx, 1);
  }
  return code;
}

export function registerThreadSyscalls(syscall, scheduler) {
  schedulerRef = scheduler;
  syscall.registerService(THREAD_SYSCALLS.CREATE_THREAD, createThread);
  syscall.registerService(THREAD_SYSCALLS.SUSPEND_THREAD, suspendThread);
  syscall.registerService(THREAD_SYSCALLS.RESUME_THREAD, resumeThread);
  syscall.registerService(THREAD_SYSCALLS.EXIT_THREAD, exitThread);
}

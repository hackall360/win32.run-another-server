export class Session {
  constructor(id, token) {
    this.id = id;
    this.token = token;
    this.processes = new Set();
    this.jobs = new Set();
    this.desktop = { id: `desktop-${id}`, windows: [] };
  }

  addProcess(proc) {
    this.processes.add(proc);
    proc.session = this;
  }

  removeProcess(proc) {
    this.processes.delete(proc);
  }

  addJob(job) {
    this.jobs.add(job);
  }

  terminate() {
    for (const job of this.jobs) {
      job.terminate();
    }
    for (const proc of this.processes) {
      proc.state = 'terminated';
    }
    this.jobs.clear();
    this.processes.clear();
  }
}

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.nextId = 1;
  }

  createSession(token) {
    const session = new Session(this.nextId++, token);
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  terminateSession(id) {
    const session = this.sessions.get(id);
    if (session) {
      session.terminate();
      this.sessions.delete(id);
    }
  }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JobTable } from '../kernel/jobs.js';
import { SessionManager } from '../kernel/session.js';
import { Scheduler } from '../kernel/scheduler.js';
import { systemToken } from '../kernel/executive/security.js';

function createScheduler() {
  return new Scheduler();
}

test('job limits and termination', () => {
  const jobs = new JobTable();
  const sched = createScheduler();
  const job = jobs.createJob(null, { maxProcesses: 2 });
  const p1 = sched.createProcess(0, systemToken, job);
  const p2 = sched.createProcess(0, systemToken, job);
  assert.equal(job.processes.size, 2);
  assert.throws(() => sched.createProcess(0, systemToken, job));
  job.terminate();
  assert.equal(p1.state, 'terminated');
  assert.equal(p2.state, 'terminated');
});

test('session termination kills processes', () => {
  const sched = createScheduler();
  const jobs = new JobTable();
  const sessions = new SessionManager();
  const session = sessions.createSession(systemToken);
  const job = jobs.createJob();
  session.addJob(job);
  const p = sched.createProcess(0, systemToken, job, session);
  assert.ok(session.processes.has(p));
  sessions.terminateSession(session.id);
  assert.equal(p.state, 'terminated');
});

import crypto from 'node:crypto';
import { createToken } from '../security.js';

const users = new Map();
const loggedOn = new Set();

function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function addUser(username, password, groups = []) {
  const sid = `S-${users.size + 1}`;
  users.set(username, { sid, groups, passwordHash: hash(password) });
  return sid;
}

export function logonUser(username, password) {
  const user = users.get(username);
  if (!user) return null;
  if (user.passwordHash !== hash(password)) return null;
  const token = createToken(user.sid, user.groups);
  loggedOn.add(token);
  return token;
}

export function isLoggedOn(token) {
  return loggedOn.has(token);
}

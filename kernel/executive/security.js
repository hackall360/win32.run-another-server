export class Token {
  constructor(sid, groups = [], privileges = []) {
    this.sid = sid;
    this.groups = new Set(groups);
    // Store privileges as an array for inspection while using an internal Set
    // for efficient lookups.
    this.privileges = Array.from(privileges);
    this._privSet = new Set(privileges);
    this.impersonation = null;
  }

  hasPrivilege(priv) {
    return this.getEffectiveToken()._privSet.has(priv);
  }

  addPrivilege(priv) {
    const effective = this._privSet;
    if (!effective.has(priv)) {
      effective.add(priv);
      this.privileges.push(priv);
    }
  }

  impersonate(token) {
    this.impersonation = token;
  }

  revertToSelf() {
    this.impersonation = null;
  }

  getEffectiveToken() {
    return this.impersonation || this;
  }
}

export function createToken(sid, groups = [], privileges = []) {
  return new Token(sid, groups, privileges);
}

export function checkAccess(token, entry, desiredRights = []) {
  const effective = token.getEffectiveToken();
  const sids = [effective.sid, ...effective.groups];
  for (const sid of sids) {
    if (entry.acl.has(sid)) {
      const rights = entry.acl.get(sid);
      if (desiredRights.every(r => rights.has(r))) {
        return true;
      } else {
        return false;
      }
    }
  }
  return desiredRights.every(r => entry.rights.has(r));
}

export const systemToken = createToken('system', [], ['createProcess']);

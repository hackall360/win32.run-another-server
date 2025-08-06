export class Registry {
  constructor() {
    this.store = new Map();
  }

  create(key, value) {
    if (this.store.has(key)) {
      throw new Error('Key already exists');
    }
    this.store.set(key, value);
  }

  read(key) {
    return this.store.get(key);
  }

  update(key, value) {
    if (!this.store.has(key)) {
      throw new Error('Key not found');
    }
    this.store.set(key, value);
  }

  delete(key) {
    this.store.delete(key);
  }

  keys() {
    return Array.from(this.store.keys());
  }
}

export const registry = new Registry();

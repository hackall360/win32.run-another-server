export class CacheManager {
  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
    this.cache = new Map(); // key -> { data, metadata }
  }

  _key(fs, path) {
    return `${fs.volumeId}:${path}`;
  }

  read(fs, path, fetch) {
    const key = this._key(fs, path);
    const entry = this.cache.get(key);
    if (entry && entry.data !== null) {
      return entry.data;
    }
    const data = fetch();
    const meta = {
      size: data.length,
      created: entry?.metadata?.created || new Date(),
      modified: new Date()
    };
    this.cache.set(key, { data, metadata: meta });
    this._evict();
    return data;
  }

  write(fs, path, data, commit) {
    const key = this._key(fs, path);
    commit(data);
    const meta = {
      size: data.length,
      created: new Date(),
      modified: new Date()
    };
    this.cache.set(key, { data, metadata: meta });
    this._evict();
  }

  getMetadata(fs, path, fetchMeta) {
    const key = this._key(fs, path);
    const entry = this.cache.get(key);
    if (entry && entry.metadata) {
      return entry.metadata;
    }
    const meta = fetchMeta();
    this.cache.set(key, { data: null, metadata: meta });
    this._evict();
    return meta;
  }

  invalidate(fs, path) {
    this.cache.delete(this._key(fs, path));
  }

  _evict() {
    while (this.cache.size > this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}

export const cacheManager = new CacheManager();

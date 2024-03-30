type Key = string | object;

export class Cache<T> {
  maxSize: number;
  keys: string[];
  cache: Record<string, T>;
  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.keys = [];
    this.cache = {};
  }

  getKey(input: Key) {
    if (typeof input === "object") {
      return JSON.stringify(input);
    }
    return input;
  }

  get(key: Key) {
    key = this.getKey(key);
    return this.cache[key];
  }

  checkSize() {
    while (this.keys.length > this.maxSize) {
      const key = this.keys.shift();
      if (key) {
        delete this.cache[key];
      }
    }
  }

  set(key: Key, value: T) {
    key = this.getKey(key);

    this.keys.push(key);
    this.cache[key] = value;
    this.checkSize();
  }

  clear() {
    this.keys = [];
    this.cache = {};
  }

  has(key: Key) {
    key = this.getKey(key);
    return key in this.cache;
  }

  delete(key: Key) {
    key = this.getKey(key);
    const index = this.keys.indexOf(key);
    if (index !== -1) {
      this.keys.splice(index, 1);
    }
    delete this.cache[key];
  }
}

class MapCode {
  constructor() {
    this.map = new Map();
  }

  set(key, value) {
    console.log(key, value);
    const date = Date.now() + 5 * 60 * 1000;
    this.map.set(key, { value, expiresIn: date });
  }

  get(key) {
    return this.map.get(key);
  }

  equals(key, value) {
    console.log(
      this.map.get(key).value,
      value,
      this.map.get(key).value === value
    );
    if (!this.map.has(key)) return false;
    if (this.map.get(key).expiresIn < Date.now()) return false;
    return this.map.get(key).value === value;
  }

  delete(key) {
    this.map.delete(key);
  }
}

module.exports = MapCode;

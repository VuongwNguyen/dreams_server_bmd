class MapCode {
  constructor() {
    this.map = new Map();
  }

  set(key, value, tlt) {
    this.map.set(key, value);

    setTimeout(() => {
      this.map.delete(key);
    }, tlt);
  }

  get(key) {
    return this.map.get(key);
  }

  delete(key) {
    this.map.delete(key);
  }

  has(key) {
    return this.map.has(key);
  }

  equals(key, value) {
    return this.map.get(key) === value;// nếu giá trị của key trùng với value thì trả về true
  }

  clear() {
    this.map.clear();
  }
}

module.exports = new MapCode();

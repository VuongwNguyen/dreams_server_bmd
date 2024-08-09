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

  equals(key, value) {
    if (!this.map.has(key)) return false;
    if (this.map.get(key).expiresIn < Date.now()) return false;

    // nếu thời gian hiện tại lớn hơn thời gian hết hạn thì trả về false
    return this.map.get(key) === value;
  }
}

module.exports = new MapCode();

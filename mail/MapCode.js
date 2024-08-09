class MapCode {
  constructor() {
    this.map = new Map();
  }

  set(key, value) {
    console.log(key, value);
    this.map.set(key, { value, expiresIn: Date.now() + 5 * 60 * 1000 });
    // thêm key và value vào map, expiresIn là thời gian hiện tại cộng thêm 5 phút
  }

  equals(key, value) {

    if (!this.map.has(key)) return false;
    if (this.map.get(key).expiresIn < Date.now()) return false;
    console.log(this.map.get(key).value, value);

    // nếu thời gian hiện tại lớn hơn thời gian hết hạn thì trả về false
    return this.map.get(key).value === value;
  }

  delete(key) {
    this.map.delete(key);
  }
}

module.exports = new MapCode();

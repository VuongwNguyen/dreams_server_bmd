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
    if(!this.map.has(key)) return false;
    return this.map.get(key) === value;// nếu giá trị của key trùng với value thì trả về true
  }

  
}

module.exports = new MapCode();

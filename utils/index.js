const _ = require("lodash");

const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};

const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]));
};

const removeUndefinedValueInObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj; 
  }

  Object.keys(obj).forEach((key) => {
    if (obj[key] == null || obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      obj[key] = removeUndefinedValueInObject(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key]; // Xóa object rỗng sau khi đệ quy
      }
    }
  });

  return obj;
};

const updateNestedObjectParser = (obj) => {
  const final = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] == "object" && !Array.isArray(obj[key])) {
      const response = updateNestedObjectParser(obj[key]);
      Object.keys(response).forEach((a) => {
        final[`${key}.${a}`] = response[a];
      });
    } else {
      final[key] = obj[key];
    }
  });

  return final;
};

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedValueInObject,
  updateNestedObjectParser,
};

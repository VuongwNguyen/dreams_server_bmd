const ENUM_INFORMATION = [
  "natl", // nationality
  "htown", // hometown
  "zone", // live in
  "gender", // gender
  "dob", // date of birth
  "job", // job
  "edu", // education
  "hobby", // hobby
  "rlts", // relationship
  "zodiac", // zodiac
  "des", // description
  "nick", // nickname
];

const BASIC_INFORMATION = ["nick", "dob", "natl", "htown", "gender", "zodiac"];
const OTHER_INFORMATION = ["zone", "job", "edu", "hobby", "rlts", "des"];

const ENUM_TYPE = ["post", "comment", "user"];

module.exports = { ENUM_INFORMATION, ENUM_TYPE, BASIC_INFORMATION, OTHER_INFORMATION };

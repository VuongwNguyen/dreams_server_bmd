const { Schema, model } = require("mongoose");

const InformationSchema = new Schema({
  account_id: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  key: {
    type: String,
    enum: ["some_key", "another_key"],
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  privacy_status: {
    type: String,
    enum: ["public", "private"],
    required: true,
  },
});
const Information = model("Information", InformationSchema);
module.exports = Information;

const { Schema, model } = require("mongoose");

const ReasonSchema = new Schema({
  reason_title: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const ReasonModel = model("Reason", ReasonSchema);

module.exports = ReasonModel;

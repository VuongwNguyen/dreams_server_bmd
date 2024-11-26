const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const PolicySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    children: [String],
  },
  { timestamps: true }
);

const Policy = model("Policy", PolicySchema);

module.exports = Policy;

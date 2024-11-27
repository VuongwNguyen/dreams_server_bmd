const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const PolicySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    children: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          default: new mongoose.Types.ObjectId(),
        },
        title: String,
      },
    ],
  },
  { timestamps: true }
);

const Policy = model("Policy", PolicySchema);

module.exports = Policy;

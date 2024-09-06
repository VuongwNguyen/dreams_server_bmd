const { Schema, model } = require("mongoose");

const HashtagSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Hashtag = model("Hashtag", HashtagSchema);

module.exports = Hashtag;

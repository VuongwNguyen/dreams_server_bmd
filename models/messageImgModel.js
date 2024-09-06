const { Schema, model } = require("mongoose");

const MessageImgSchema = new Schema(
  {
    message_id: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    img_url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MessageImg = model("MessageImg", MessageImgSchema);

module.exports = MessageImg;

const { Schema, model } = require("mongoose");

const MessageSchema = new Schema(
  {
    room_id: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    send_at: {
      type: Date,
      default: Date.now,
    },
    images: [
      {
        type: {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = model("Message", MessageSchema);

module.exports = Message;

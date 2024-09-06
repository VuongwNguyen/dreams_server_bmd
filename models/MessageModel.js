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
  },
  {
    timestamps: true,
  }
);

const Message = model("Message", MessageSchema);

module.exports = Message;

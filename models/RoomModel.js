const e = require("cors");
const { Schema, model } = require("mongoose");

const RoomSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["private", "group"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Room = model("Room", RoomSchema);

module.exports = Room;

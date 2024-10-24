const { Schema, model } = require("mongoose");

const membersSchema = new Schema({
  account_id: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  joined_at: {
    type: Date,
    default: Date.now,
  },
});

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
    members: {
      type: [membersSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Room = model("Room", RoomSchema);

module.exports = Room;

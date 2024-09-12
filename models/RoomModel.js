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
    members: [
      {
        type: {
          account_id: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
          },
          joined_at: {
            type: Date,
            default: Date.now,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Room = model("Room", RoomSchema);

module.exports = Room;

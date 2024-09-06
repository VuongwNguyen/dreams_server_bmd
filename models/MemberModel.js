const { Schema, model } = require("mongoose");

const MemberSchema = new Schema(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    room_id: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Member = model("Member", MemberSchema);

module.exports = Member;

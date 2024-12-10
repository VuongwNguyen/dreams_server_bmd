const { Schema, model } = require("mongoose");
const User = require("./AccountModel");

const MembersSchema = new Schema({
  account_id: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  joined_at: {
    type: Date,
    default: Date.now,
  },
  delete_messages_at: {
    type: Date,
    default: Date.now,
  },
});

const RoomSchema = new Schema(
  {
    is_group: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      require: false,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    members: {
      type: [MembersSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

RoomSchema.pre("save", async function (next) {
  const user = await User.findOne({ _id: this.host }).lean();
  if (!user) {
    next(new Error("Host doesn't exist"));
    return;
  }

  if (!this.name && this.members.length > 2) {
    this.name = `Nhóm của ${user.first_name} ${user.last_name}`;
  }

  next();
});

const Room = model("Room", RoomSchema);

module.exports = Room;

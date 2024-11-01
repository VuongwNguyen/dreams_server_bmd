const { Schema, model } = require("mongoose");

const FollowSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
});

// FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = model("Follow", FollowSchema);

module.exports = Follow;

const { Schema, model } = require("mongoose");

const PostLikeSchema = new Schema(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
PostLikeSchema.index({ post_id: 1, account_id: 1 }, { unique: true });

const PostLike = model("PostLike", PostLikeSchema);

module.exports = PostLike;

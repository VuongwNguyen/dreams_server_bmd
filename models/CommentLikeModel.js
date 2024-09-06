const { Schema, model } = require("mongoose");

const CommentLikeSchema = new Schema(
  {
    comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
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
CommentLikeSchema.index({ comment_id: 1, account_id: 1 }, { unique: true });

const CommentLike = model("CommentLike", CommentLikeSchema);

module.exports = CommentLike;

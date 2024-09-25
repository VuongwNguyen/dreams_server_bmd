const { Schema, model } = require("mongoose");

const CommentSchema = new Schema(
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
    reply_comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
    root_comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    visible: { type: Boolean, required: true, default: true },
    depth: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);
const Comment = model("Comment", CommentSchema);

module.exports = Comment;

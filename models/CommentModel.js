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
    parent_comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const Comment = model("Comment", CommentSchema);

module.exports = Comment;

const { Schema, model } = require("mongoose");

const PostTagSchema = new Schema(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    tag_id: {
      type: Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PostTag = model("PostTag", PostTagSchema);

module.exports = PostTag;

const { Schema, model } = require("mongoose");

const PostHashtagSchema = new Schema(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    hashtag_id: {
      type: Schema.Types.ObjectId,
      ref: "Hashtag",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PostHashtag = model("PostHashtag", PostHashtagSchema);

module.exports = PostHashtag;

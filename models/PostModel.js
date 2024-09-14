const { Schema, model } = require("mongoose");

const PostSchema = new Schema(
  {
    parent_post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: false,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    privacy_status: {
      type: String,
      enum: ["public", "private"],
      required: true,
    },
    images: [
      {
        type: {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
        required: false,
      },
    ],
    video: [
      {
        type: {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
        required: false,
      },
    ],
    tagUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Account",
        required: false,
      },
    ],
    hashtags: [
      {
        type: String,
        required: false,
        ref: "Hashtag",
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Post = model("Post", PostSchema);

module.exports = Post;

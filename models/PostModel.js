const { Schema, model } = require("mongoose");

const PostSchema = new Schema(
  {
    children_post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: false,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    content: {
      type: String,
      required: false,
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
    videos: [
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
        type: Schema.Types.ObjectId,
        required: false,
        ref: "Hashtag",
      },
    ],
    view_count: {
      type: Number,
      default: 0,
    },
    like: {
      type: [{ type: Schema.Types.ObjectId, ref: "Account" }],
      default: [],
    },
    violateion: {
      type: {
        reason: { type: String, default: "" },
        date: { type: Date, default: null },
      },
    },
  },
  {
    timestamps: true,
  }
);
const Post = model("Post", PostSchema);

module.exports = Post;

const { Schema, model } = require("mongoose");

const PostImageSchema = new Schema(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const PostImage = model("PostImage", PostImageSchema);

module.exports = PostImage;

const { Schema, model } = require("mongoose");

const PostViewedSchema = new Schema({
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
});

const PostViewed = model("PostViewed", PostViewedSchema);

module.exports = PostViewed;

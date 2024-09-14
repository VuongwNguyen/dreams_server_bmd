const Account = require("../models/AccountModel");
const Post = require("../models/PostModel");
const Hashtag = require("../models/HashtagModel");
const { ErrorResponse } = require("../core/reponseHandle");

class PostService {
  async createPost({
    parent_id,
    user_id,
    content,
    privacy_status = "private",
    tagUsers = [],
    hashtags = [],
    videos = [],
    images = [],
  }) {
    throw new Error("Not implemented");
    let user = null;
    let parentPost = null;


    if (parent_id) {
      parentPost = await Post.findOne({ _id: parent_id }).lean();
    }

    user = await Account.findOne({ _id: user_id }).lean();

    if (!user) {
      throw ErrorResponse({ message: "User doesn't exist" });
    }

    const arrHashtags = [];

    if (hashtags.length > 0) {
      for (const hashtag of hashtags) {
        const tag = await Hashtag.findOneAndUpdate(
          { title: hashtag },
          { title: hashtag },
          { upsert: true, new: true }
        );

        arrHashtags.push(tag._id);
      }
    }

    if (!parentPost && !content) {
      throw new ErrorResponse({ message: "Content is required" });
    }

    const newPost = await Post.create({
      content,
      account_id: user_id,
      parent_post_id: parentPost?.parent_post_id
        ? parentPost.parent_post_id
        : parentPost?._id,
      privacy_status,
      tagUsers: tagUsers,
      hashtags: arrHashtags,
      videos,
      images,
    });

    return newPost;
  }
}

module.exports = new PostService();

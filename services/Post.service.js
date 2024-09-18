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
    // throw new Error("Not implemented");
    let user = null;
    let parentPost = null;

    if (parent_id) {
      parentPost = await Post.findOne({ _id: parent_id }).lean();
    }

    user = await Account.findOne({ _id: user_id }).lean();

    if (!user) {
      throw new ErrorResponse({ message: "User doesn't exist" });
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

  async getTrendingPosts({ user_id, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;
    const _skip = (_page - 1) * _limit;

    const user = await Account.findOne({ _id: user_id })
      .select(
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -avatar -infomation"
      )
      .lean();

    const totalRecords = await Post.countDocuments({
      privacy_status: "public",
      _id: { $nin: user.post_viewed }, // loại bỏ các bài đã xem
    });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    const posts = await Post.find({
      privacy_status: "public",
      _id: { $nin: user.post_viewed }, // loại bỏ các bài đã xem
      // createdAt:  { $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) } // lấy bài viết trong vòng 7 ngày
    })
      .sort({ view_count: -1 })
      .skip(_skip)
      .limit(_limit)
      .select("-updatedAt -createdAt -__v -view_count")
      .populate(
        "account_id",
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -avatar -infomation -post_viewed -email -phone"
      )
      .populate(
        "tagUsers",
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -avatar -infomation -post_viewed -email -phone"
      )
      .populate("hashtags", "-_id -updatedAt -createdAt -__v")
      .lean();

    if (!posts)
      throw new ErrorResponse({
        message: "Post not found",
        code: 400,
      });

    posts.forEach((post) => {
      post.likeCount = post.like.length;
      delete post.like;
    });

    return {
      list: posts,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: _page,
        limit: _limit,
        hasNext: posts.length === _limit,
        hasPrevious: _page > 1,
      },
    };
  }

  async setPostViewed({ user_id, post_id }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user) {
      throw new ErrorResponse({ message: "User not found", code: 401 });
    }

    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      throw new ErrorResponse({ message: "Post not found", code: 401 });
    }

    if (user.post_viewed?.includes(post_id)) {
      return;
    }

    user.post_viewed?.push(post_id);

    await user.save();
  }

  async countViewPost({ post_id }) {
    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      throw new ErrorResponse({ message: "Post not found", code: 404 });
    }

    post.view_count += 1;

    await post.save();
  }

  async likePost({ user_id, post_id }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user) {
      throw new ErrorResponse({ message: "User not found", code: 401 });
    }

    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      throw new ErrorResponse({ message: "Post not found", code: 401 });
    }

    if (post.like.includes(user_id)) { // nếu đã like rồi thì bỏ like
      post.like = post.like.filter((id) => id !== user_id); // loại bỏ id user khỏi mảng like
    } else {
      post.like.push(user_id); // thêm id user vào mảng like
    }

    await post.save();
  }
}

module.exports = new PostService();

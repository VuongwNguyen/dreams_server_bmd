require("dotenv").config();
const Account = require("../models/AccountModel");
const Post = require("../models/PostModel");
const Follow = require("../models/FollowModel");
const Hashtag = require("../models/HashtagModel");
const { ErrorResponse } = require("../core/reponseHandle");
const _ = require("lodash");
const { Worker } = require("bullmq");

// const notificationWorker = new Worker(
//   "notification",
//   async (job) => {
//     const { tokens } = job.data;
//   },
//   {
//     connection: {
//       host: process.env.REDIS_HOST,
//       port: process.env.REDIS_PORT,
//     },
//   }
// );

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

    if (Array.isArray(hashtags)) {
      for (const hashtag of hashtags) {
        const tag = await Hashtag.findOneAndUpdate(
          { title: hashtag },
          { title: hashtag },
          { upsert: true, new: true }
        );

        arrHashtags.push(tag._id);
      }
    } else {
      const tag = await Hashtag.findOneAndUpdate(
        { title: hashtags },
        { title: hashtags },
        { upsert: true, new: true }
      );

      arrHashtags.push(tag._id);
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

    // const tokens = await Follow.aggregate([
    //   {
    //     $match: {
    //       following: user_id,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "Account",
    //       localField: "follower",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $match: {
    //             fcm_token: { $ne: null },
    //           },
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             fcm_token: 1,
    //           },
    //         },
    //       ],
    //       as: "user",
    //     },
    //   },
    //   {
    //     $unwind: "$user",
    //   },
    //   {
    //     $group: {
    //       _id: "$following",
    //       fcm_tokens: {
    //         $push: "$user.fcm_token",
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       fcm_tokens: 1,
    //     },
    //   },
    // ]);

    // const chunks = _.chunk(tokens.tokens, 500);

    // chunks.forEach(function (chunk) {
    //   notificationWorker.add({ tokens: chunk });
    // });

    return newPost;
  }
}

module.exports = new PostService();

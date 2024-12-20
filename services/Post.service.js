const { Account, Post, Hashtag, Follow } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const _ = require("lodash");
const { Worker } = require("bullmq");
const { default: mongoose } = require("mongoose");
const CommentService = require("./Comment.service");
const { url } = require("../config/cloudinary");
const NotificationService = require("./Notification.service");

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
    children_post_id,
    user_id,
    content,
    privacy_status = "private",
    tagUsers = [],
    hashtags = [],
    videos = [],
    images = [],
    title,
  }) {
    let user = null;
    let children_post = null;

    if (children_post_id) {
      children_post = await Post.findOne({ _id: children_post_id }).lean();
    }

    user = await Account.findOne({ _id: user_id }).lean();

    if (!user) {
      throw new ErrorResponse({ message: "User doesn't exist" });
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

    if (!children_post && !content) {
      throw new ErrorResponse({ message: "Content is required" });
    }

    const newPost = await Post.create({
      content,
      account_id: user_id,
      children_post_id: children_post?.children_post_id
        ? children_post.children_post_id
        : children_post?._id,
      privacy_status,
      tagUsers: tagUsers,
      hashtags: arrHashtags,
      videos,
      images,
      title,
    });

    // Ensure tagUsers is an array
    const tagUsersArray = Array.isArray(tagUsers) ? tagUsers : [tagUsers];

    if (tagUsersArray.length > 0) {
      await Promise.all(
        tagUsersArray.map((tagUser) =>
          NotificationService.createNotification({
            sender: user_id,
            receiver: tagUser,
            post_id: newPost._id,
            type: "mention",
          })
        )
      ); // gửi thông báo cho người được tag
    }

    const followers = await Follow.find({ following: user_id }).lean();

    // Ensure followers is an array
    const followersArray = Array.isArray(followers) ? followers : [followers];

    if (followersArray.length > 0) {
      await Promise.all(
        followersArray.map((follower) =>
          NotificationService.createNotification({
            sender: user_id,
            receiver: follower.follower,
            post_id: newPost._id,
            type: "post",
          })
        )
      ); // gửi thông báo cho người theo dõi
    }
    // detail post

    const post = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(newPost._id.toString()),
          $and: [
            {
              $or: [{ violateion: { $exists: false } }, { violateion: null }],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: {
          path: "$author",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
        },
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "follows",
          let: { following: "$account_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$following"] },
                  ],
                },
              },
            },
          ],
          as: "followedStatus",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { postId: "$children_post_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$postId"] } } },
            {
              $lookup: {
                from: "accounts",
                localField: "account_id",
                foreignField: "_id",
                as: "author",
              },
            },
            {
              $unwind: "$author",
            },
            {
              $lookup: {
                from: "accounts",
                localField: "tagUsers",
                foreignField: "_id",
                as: "tagUsers",
              },
            },
            {
              $lookup: {
                from: "hashtags",
                localField: "hashtags",
                foreignField: "_id",
                as: "hashtags",
              },
            },
            {
              $lookup: {
                from: "follows",
                let: {
                  followerId: new mongoose.Types.ObjectId(user_id),
                  followingId: "$account_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$follower", "$$followerId"] },
                          { $eq: ["$following", "$$followingId"] },
                        ],
                      },
                    },
                  },
                ],
                as: "followedStatus",
              },
            },
            {
              $addFields: {
                tagUsers: {
                  $map: {
                    input: "$tagUsers",
                    as: "tagUser",
                    in: {
                      _id: "$$tagUser._id",
                      fullname: {
                        $concat: [
                          "$$tagUser.first_name",
                          " ",
                          "$$tagUser.last_name",
                        ],
                      },
                    },
                  },
                },
                followedStatus: {
                  $cond: {
                    if: { $gt: [{ $size: "$followedStatus" }, 0] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                author: {
                  _id: "$author._id",
                  fullname: {
                    $concat: ["$author.first_name", " ", "$author.last_name"],
                  },
                  avatar: "$author.avatar.url",
                  isJudge: "$author.isJudge",
                },
                title: 1,
                content: 1,
                createdAt: 1,
                privacy_status: 1,
                images: 1,
                videos: 1,
                tagUsers: 1,
                hashtags: 1,
                deleted: 1,
              },
            },
          ],
          as: "childrenPost",
        },
      },
      {
        $addFields: {
          childrenPost: {
            $ifNull: [{ $arrayElemAt: ["$childrenPost", 0] }, null],
          },
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] }, // Kiểm tra người dùng đã like chưa
          commentCount: { $size: "$comments" },
          author: {
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
          },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$$tagUser._id",
                fullname: {
                  $concat: ["$$tagUser.first_name", " ", "$$tagUser.last_name"],
                },
              },
            },
          },
          followedStatus: {
            $cond: {
              if: { $gt: [{ $size: "$followedStatus" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          author: {
            _id: 1,
            fullname: 1,
            avatar: "$author.avatar.url",
          },
          title: 1,
          content: 1,
          createdAt: 1,
          privacy_status: 1,
          images: {
            url: 1,
            _id: 1,
          },
          videos: {
            url: 1,
            _id: 1,
          },
          tagUsers: {
            _id: 1,
            fullname: 1,
          },
          hashtags: {
            _id: 1,
            title: 1,
          },
          likeCount: 1,
          isLiked: 1,
          followedStatus: 1,
          commentCount: 1,
          childrenPost: 1,
        },
      },
    ]);

    if (user_id == post[0].author._id.toString()) {
      post[0].isSelf = true;
    }

    return post[0];
  }

  async getTrendingPosts({ user_id, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;

    const user = await Account.findOne({ _id: user_id }).lean();

    const totalRecords = await Post.countDocuments({
      privacy_status: "public",
      _id: { $nin: user.post_viewed },
      $and: [
        {
          $or: [{ violateion: { $exists: false } }, { violateion: null }],
        },
      ],
    });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    // Lấy các bài viết public, không phải của user, không phải bài đã xem
    const posts = await Post.aggregate([
      {
        $match: {
          privacy_status: "public",
          _id: { $nin: user.post_viewed },
          $and: [
            {
              $or: [{ violateion: { $exists: false } }, { violateion: null }],
            },
          ],
        },
      },
      {
        $sort: { view_count: -1, createdAt: -1, like: -1 },
      },
      {
        $skip: (+_page - 1) * +_limit,
      },
      {
        $limit: +_limit,
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
        },
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "follows",
          let: {
            followerId: new mongoose.Types.ObjectId(user_id),
            followingId: "$account_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$follower", "$$followerId"] },
                    { $eq: ["$following", "$$followingId"] },
                  ],
                },
              },
            },
          ],
          as: "followedStatus",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { postId: "$children_post_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$postId"] } } },
            {
              $lookup: {
                from: "accounts",
                localField: "account_id",
                foreignField: "_id",
                as: "author",
              },
            },
            {
              $unwind: "$author",
            },
            {
              $lookup: {
                from: "accounts",
                localField: "tagUsers",
                foreignField: "_id",
                as: "tagUsers",
              },
            },
            {
              $lookup: {
                from: "hashtags",
                localField: "hashtags",
                foreignField: "_id",
                as: "hashtags",
              },
            },
            {
              $lookup: {
                from: "follows",
                let: {
                  followerId: new mongoose.Types.ObjectId(user_id),
                  followingId: "$account_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$follower", "$$followerId"] },
                          { $eq: ["$following", "$$followingId"] },
                        ],
                      },
                    },
                  },
                ],
                as: "followedStatus",
              },
            },
            {
              $addFields: {
                tagUsers: {
                  $map: {
                    input: "$tagUsers",
                    as: "tagUser",
                    in: {
                      _id: "$$tagUser._id",
                      fullname: {
                        $concat: [
                          "$$tagUser.first_name",
                          " ",
                          "$$tagUser.last_name",
                        ],
                      },
                    },
                  },
                },
                followedStatus: {
                  $cond: {
                    if: { $gt: [{ $size: "$followedStatus" }, 0] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                author: {
                  _id: "$author._id",
                  fullname: {
                    $concat: ["$author.first_name", " ", "$author.last_name"],
                  },
                  avatar: "$author.avatar.url",
                  isJudge: "$author.isJudge",
                },
                title: 1,
                content: 1,
                createdAt: 1,
                privacy_status: 1,
                images: 1,
                videos: 1,
                tagUsers: 1,
                hashtags: 1,
                deleted: 1,
              },
            },
          ],
          as: "childrenPost",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] },
          commentCount: { $size: "$comments" },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$$tagUser._id",
                fullname: {
                  $concat: ["$$tagUser.first_name", " ", "$$tagUser.last_name"],
                },
              },
            },
          },
          author: {
            _id: "$author._id",
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
            avatar: "$author.avatar.url",
          },
          followedStatus: {
            $cond: {
              if: { $gt: [{ $size: "$followedStatus" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          author: {
            _id: 1,
            fullname: 1,
            avatar: 1,
          },
          title: 1,
          content: 1,
          createdAt: 1,
          privacy_status: 1,
          images: {
            url: 1,
            _id: 1,
          },
          videos: {
            url: 1,
            _id: 1,
          },
          tagUsers: {
            _id: 1,
            fullname: 1,
          },
          hashtags: {
            _id: 1,
            title: 1,
          },
          likeCount: 1,
          isLiked: 1,
          followedStatus: 1,
          commentCount: 1,
          childrenPost: {
            $ifNull: [{ $arrayElemAt: ["$childrenPost", 0] }, null],
          },
        },
      },
    ]);

    posts.forEach((post, index) => {
      if (user_id == post.author._id.toString()) {
        post.isSelf = true;
      }

      if (post?.childrenPost?.deleted || post.author.isJudge) {
        posts.splice(index, 1);
      }
    });

    return {
      list: posts,
      page: {
        maxPage: Math.ceil(totalRecords / +_limit),
        currentPage: +_page,
        limit: _limit,
        hasNext: posts.length === +_limit,
        hasPrevious: +_page > 1,
      },
    };
  }

  async getFollowingPosts({ user_id, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;

    const user = await Account.findOne({ _id: user_id }).lean();
    const following = await Follow.find({ follower: user_id })
      .select("following")
      .lean();
    const followingIds = following.map((item) => item.following);

    const totalRecords = await Post.countDocuments({
      privacy_status: "public",
      account_id: { $in: followingIds },
      $and: [
        {
          $or: [{ violateion: { $exists: false } }, { violateion: null }],
        },
      ],
    });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    const posts = await Post.aggregate([
      {
        $match: {
          privacy_status: "public",
          account_id: { $in: followingIds },
          $and: [
            {
              $or: [{ violateion: { $exists: false } }, { violateion: null }],
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (+_page - 1) * +_limit,
      },
      {
        $limit: +_limit,
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id", // trường nối
          as: "author",
        },
      },
      {
        $unwind: {
          path: "$author",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
        },
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "follows",
          let: { following: "$account_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$following"] },
                  ],
                },
              },
            },
          ],
          as: "followedStatus",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { postId: "$children_post_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$postId"] } } },
            {
              $lookup: {
                from: "accounts",
                localField: "account_id",
                foreignField: "_id",
                as: "author",
              },
            },
            {
              $unwind: "$author",
            },
            {
              $lookup: {
                from: "accounts",
                localField: "tagUsers",
                foreignField: "_id",
                as: "tagUsers",
              },
            },
            {
              $lookup: {
                from: "hashtags",
                localField: "hashtags",
                foreignField: "_id",
                as: "hashtags",
              },
            },
            {
              $lookup: {
                from: "follows",
                let: {
                  followerId: new mongoose.Types.ObjectId(user_id),
                  followingId: "$account_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$follower", "$$followerId"] },
                          { $eq: ["$following", "$$followingId"] },
                        ],
                      },
                    },
                  },
                ],
                as: "followedStatus",
              },
            },
            {
              $addFields: {
                tagUsers: {
                  $map: {
                    input: "$tagUsers",
                    as: "tagUser",
                    in: {
                      _id: "$$tagUser._id",
                      fullname: {
                        $concat: [
                          "$$tagUser.first_name",
                          " ",
                          "$$tagUser.last_name",
                        ],
                      },
                    },
                  },
                },
                followedStatus: {
                  $cond: {
                    if: { $gt: [{ $size: "$followedStatus" }, 0] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                author: {
                  _id: "$author._id",
                  fullname: {
                    $concat: ["$author.first_name", " ", "$author.last_name"],
                  },
                  avatar: "$author.avatar.url",
                },
                title: 1,
                content: 1,
                createdAt: 1,
                privacy_status: 1,
                images: 1,
                videos: 1,
                tagUsers: 1,
                hashtags: 1,
                deleted: 1,
              },
            },
          ],
          as: "childrenPost",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] }, // Kiểm tra người dùng đã like chưa
          commentCount: { $size: "$comments" },
          author: {
            _id: "$author._id",
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
            avatar: "$author.avatar.url",
          },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$$tagUser._id",
                fullname: {
                  $concat: ["$$tagUser.first_name", " ", "$$tagUser.last_name"],
                },
              },
            },
          },
          followedStatus: {
            $cond: {
              if: { $gt: [{ $size: "$followedStatus" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          author: {
            _id: 1,
            fullname: 1,
            avatar: 1,
          },
          title: 1,
          content: 1,
          createdAt: 1,
          privacy_status: 1,
          images: {
            url: 1,
            _id: 1,
          },
          videos: {
            url: 1,
            _id: 1,
          },
          tagUsers: {
            _id: 1,
            fullname: 1,
          },
          hashtags: {
            _id: 1,
            title: 1,
          },
          likeCount: 1,
          isLiked: 1,
          followedStatus: 1,
          commentCount: 1,
          childrenPost: {
            $ifNull: [{ $arrayElemAt: ["$childrenPost", 0] }, null],
          },
        },
      },
    ]);

    posts.forEach((post, index) => {
      if (user_id == post.author._id.toString()) {
        post.isSelf = true;
      }

      if (post?.childrenPost?.deleted || post.author.isJudge) {
        posts.splice(index, 1);
      }
    });

    return {
      list: posts,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: +_page,
        limit: +_limit,
        hasNext: posts.length === +_limit,
        hasPrevious: +_page > 1,
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
    let msg = "";
    if (!user) {
      throw new ErrorResponse({ message: "User not found", code: 401 });
    }

    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      throw new ErrorResponse({ message: "Post not found", code: 401 });
    }

    if (post.like.includes(user_id)) {
      await Post.updateOne({ _id: post_id }, { $pull: { like: user_id } });
      msg = "Unlike success";
    } else {
      await Post.updateOne({ _id: post_id }, { $addToSet: { like: user_id } });
      msg = "Like success";
      await NotificationService.createNotification({
        sender: user_id,
        receiver: post.account_id,
        post_id: post_id,
        type: "like",
      });
    }

    const result = await Post.findOne({ _id: post_id });

    return {
      message: msg,
      data: {
        currentLike: result.like.length,
        isLiked: result.like.includes(user_id),
      },
    };
  }

  async getPostByUser({ user_id, user_id_view, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;
    if (!user_id_view) user_id_view = user_id;

    const user = await Account.findOne({ _id: user_id }).lean();
    const userView = await Account.findOne({ _id: user_id_view }).lean();

    const privacy_status =
      user_id === user_id_view ? ["public", "private"] : ["public"];

    const totalRecords = await Post.countDocuments({
      $and: [
        {
          $or: [
            { account_id: new mongoose.Types.ObjectId(user_id_view) },
            {
              tagUsers: new mongoose.Types.ObjectId(
                user_id === user_id_view ? user_id : user_id_view
              ),
            },
          ],
        },
        { privacy_status: { $in: privacy_status } },
        {
          $or: [{ violateion: { $exists: false } }, { violateion: null }],
        },
      ],
    });

    if (!user || !userView)
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });

    const posts = await Post.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { account_id: new mongoose.Types.ObjectId(user_id_view) },
                {
                  tagUsers: new mongoose.Types.ObjectId(
                    user_id === user_id_view ? user_id : user_id_view
                  ),
                },
              ],
            },
            { privacy_status: { $in: privacy_status } },
            {
              $or: [{ violateion: { $exists: false } }, { violateion: null }],
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (+_page - 1) * +_limit,
      },
      {
        $limit: +_limit,
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: {
          path: "$author",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
        },
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "follows",
          let: { following: "$account_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$following"] },
                  ],
                },
              },
            },
          ],
          as: "followedStatus",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { postId: "$children_post_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$postId"] } } },
            {
              $lookup: {
                from: "accounts",
                localField: "account_id",
                foreignField: "_id",
                as: "author",
              },
            },
            {
              $unwind: "$author",
            },
            {
              $lookup: {
                from: "accounts",
                localField: "tagUsers",
                foreignField: "_id",
                as: "tagUsers",
              },
            },
            {
              $lookup: {
                from: "hashtags",
                localField: "hashtags",
                foreignField: "_id",
                as: "hashtags",
              },
            },
            {
              $lookup: {
                from: "follows",
                let: {
                  followerId: new mongoose.Types.ObjectId(user_id),
                  followingId: "$account_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$follower", "$$followerId"] },
                          { $eq: ["$following", "$$followingId"] },
                        ],
                      },
                    },
                  },
                ],
                as: "followedStatus",
              },
            },
            {
              $addFields: {
                tagUsers: {
                  $map: {
                    input: "$tagUsers",
                    as: "tagUser",
                    in: {
                      _id: "$$tagUser._id",
                      fullname: {
                        $concat: [
                          "$$tagUser.first_name",
                          " ",
                          "$$tagUser.last_name",
                        ],
                      },
                    },
                  },
                },
                followedStatus: {
                  $cond: {
                    if: { $gt: [{ $size: "$followedStatus" }, 0] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                author: {
                  _id: "$author._id",
                  fullname: {
                    $concat: ["$author.first_name", " ", "$author.last_name"],
                  },
                  avatar: "$author.avatar.url",
                },
                title: 1,
                content: 1,
                createdAt: 1,
                privacy_status: 1,
                images: 1,
                videos: 1,
                tagUsers: 1,
                hashtags: 1,
                deleted: 1,
              },
            },
          ],
          as: "childrenPost",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] },
          commentCount: { $size: "$comments" },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$$tagUser._id",
                fullname: {
                  $concat: ["$$tagUser.first_name", " ", "$$tagUser.last_name"],
                },
              },
            },
          },
          followedStatus: {
            $cond: {
              if: { $gt: [{ $size: "$followedStatus" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          createdAt: 1,
          privacy_status: 1,
          images: {
            url: 1,
            _id: 1,
          },
          videos: {
            url: 1,
            _id: 1,
          },
          tagUsers: {
            _id: 1,
            fullname: 1,
          },
          hashtags: {
            _id: 1,
            title: 1,
          },
          author: {
            _id: 1,
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
            avatar: "$author.avatar.url",
          },
          likeCount: 1,
          isLiked: 1,
          followedStatus: 1,
          commentCount: 1,
          childrenPost: {
            $ifNull: [{ $arrayElemAt: ["$childrenPost", 0] }, null],
          },
        },
      },
    ]);

    posts.forEach((post, index) => {
      if (user_id == post.author._id.toString()) {
        post.isSelf = true;
      }

      if (post?.childrenPost?.deleted || post.author.isJudge) {
        posts.splice(index, 1);
      } // Xóa bài chia sẽ nếu bài gốc bị xóa
    });

    return {
      list: posts,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: +_page,
        limit: +_limit,
        hasNext: posts.length === +_limit,
        hasPrevious: _page > 1,
      },
    };
  }

  async getPostDetail({ user_id, post_id }) {
    const post = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(post_id),
          $and: [
            {
              $or: [{ violateion: { $exists: false } }, { violateion: null }],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: {
          path: "$author",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
        },
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "follows",
          let: { following: "$account_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$following"] },
                  ],
                },
              },
            },
          ],
          as: "followedStatus",
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "children_post_id",
          foreignField: "_id",
          as: "childrenPost",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] }, // Kiểm tra người dùng đã like chưa
          commentCount: { $size: "$comments" },
          author: {
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
          },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$$tagUser._id",
                fullname: {
                  $concat: ["$$tagUser.first_name", " ", "$$tagUser.last_name"],
                },
              },
            },
          },
          followedStatus: {
            $cond: {
              if: { $gt: [{ $size: "$followedStatus" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          author: {
            _id: 1,
            fullname: 1,
            avatar: "$author.avatar.url",
          },
          title: 1,
          content: 1,
          createdAt: 1,
          privacy_status: 1,
          images: {
            url: 1,
            _id: 1,
          },
          videos: {
            url: 1,
            _id: 1,
          },
          tagUsers: {
            _id: 1,
            fullname: 1,
          },
          hashtags: {
            _id: 1,
            title: 1,
          },
          likeCount: 1,
          isLiked: 1,
          followedStatus: 1,
          commentCount: 1,
          childrenPost: {
            $ifNull: [{ $arrayElemAt: ["$childrenPost", 0] }, null],
          },
        },
      },
    ]);

    if (post[0].childrenPost?.deleted || post[0].author.isJudge) {
      post[0] = null;
    }

    if (!post[0])
      throw new ErrorResponse({ message: "Post not found", code: 404 });

    const comments = await CommentService.getParentCommentByPostId({
      post_id,
      page: 1,
      limit: 10,
      user_id,
    });

    if (post.author?._id.toString() === user_id) post.isSelf = true;

    return {
      post: post[0],
      comments,
    };
  }

  async getPostByHashtag({ user_id, hashtag, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;
    const _skip = (_page - 1) * _limit;

    const tag = await Hashtag.findOne({ title: hashtag });

    const totalRecords = await Post.countDocuments({
      hashtags: { $in: tag._id },
    });

    const posts = await Post.find({
      hashtags: tag._id,
    })
      .sort({ view_count: -1, createdAt: -1 })
      .skip(_skip)
      .limit(_limit)
      .select("-updatedAt -__v -view_count")
      .populate(
        "account_id",
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -infomation -post_viewed -email -phone"
      )
      .populate(
        "tagUsers",
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -avatar -infomation -post_viewed -email -phone"
      )
      .populate("hashtags", "-_id -updatedAt -createdAt -__v")
      .lean();

    const followedStatus = await Follow.findOne({
      account_id: user_id,
      followings: posts.account_id?._id,
    });

    posts.forEach((post) => {
      post.likeCount = post.like.length;
      post.isLiked = post.like.includes(user_id);
      delete post.like;
      post.followedStatus = followedStatus ? true : false;
      post.isSelf = post.account_id._id.toString() === user_id;
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

  async getPostByTitleOrContent({ user_id, keyword, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;
    const _skip = (_page - 1) * _limit;

    if (!keyword) {
      throw new ErrorResponse({
        message: "Keyword is required",
        code: 400,
      });
    }

    const totalRecords = await Post.countDocuments({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ],
    });

    const posts = await Post.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ],
    })
      .sort({ view_count: -1, createdAt: -1 })
      .skip(_skip)
      .limit(_limit)
      .select("-updatedAt -__v -view_count")
      .populate(
        "account_id",
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -infomation -post_viewed -email -phone"
      )
      .populate(
        "tagUsers",
        "-updatedAt -createdAt -__v -password -fcm_token -isActivated -isVerified -role -avatar -infomation -post_viewed -email -phone"
      )
      .populate("hashtags", "-_id -updatedAt -createdAt -__v")
      .lean();

    const followedStatus = await Follow.findOne({
      account_id: user_id,
      followings: posts.account_id?._id,
    });

    posts.forEach((post) => {
      post.likeCount = post.like.length;
      post.isLiked = post.like.includes(user_id);
      delete post.like;
      post.followedStatus = followedStatus ? true : false;
      post.isSelf = post.account_id._id.toString() === user_id;
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

  async SuspensionOfPosting({ post_id, reason, date_of_judge }) {
    const post = await Post.findOne({ _id: post_id });

    post.violateion = {
      reason: reason,
      date: date_of_judge,
    };

    const suspen = await post.save();
    if (!suspen) {
      throw new ErrorResponse({
        message: "Failed to suspend post",
        code: 400,
      });
    }
    return {
      data: suspen,
      message: "Post has been suspended",
    };
  }

  async editPost({
    user_id,
    post_id,
    content,
    privacy_status = "",
    tagUsers = [],
    hashtags = [],
    videos = [],
    images = [],
    title,
  }) {
    const user = await Account.findById(user_id).lean();
    const post = await Post.findById(post_id);

    if (!post)
      throw new ErrorResponse({
        message: "Post not found",
        code: 400,
      });

    if (post.children_post_id)
      throw new ErrorResponse({
        message: "Do not edit shared post",
        code: 400,
      });

    if (user._id.toString() !== post.account_id.toString())
      throw new ErrorResponse({
        message: "You do not have permission edit post",
        code: 401,
      });

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

    if (content) post.content = content;
    if (title) post.title = title;
    if (hashtags) post.hashtags = arrHashtags;
    if (images) post.images = images;
    if (videos) post.videos = videos;
    if (privacy_status) post.privacy_status = privacy_status;
    if (tagUsers) post.tagUsers = tagUsers;

    await post.save({ new: true });

    return {
      post,
      message: "Post has been updated",
    };
  }

  async removePost({ user_id, post_id }) {
    const post = await Post.findById(post_id);

    if (!post) {
      throw new ErrorResponse({
        message: "Post not found",
        code: 404,
      });
    }

    if (post.account_id.toString() !== user_id) {
      throw new ErrorResponse({
        message: "You are not authorized to remove this post",
        code: 401,
      });
    }

    post.delete();

    return {
      post,
      message: "Post has been removed",
    };
  }
}

module.exports = new PostService();

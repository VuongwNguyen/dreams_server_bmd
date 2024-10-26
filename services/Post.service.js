const { Account, Post, Hashtag, Follow } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const _ = require("lodash");
const { Worker } = require("bullmq");
const { default: mongoose } = require("mongoose");
const CommentService = require("./Comment.service");

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
    title,
  }) {
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
      title,
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

  async getTrendingPosts({ user_id, _page = 1, _limit = 10 }) {
    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;

    const user = await Account.findOne({ _id: user_id }).lean();

    const totalRecords = await Post.countDocuments({
      privacy_status: "public",
      // _id: { $nin: user.post_viewed }, // loại bỏ các bài đã xem
    });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }
    //  lấy các bài viết public, không phải của user, không phải bài đã xem, user đang follow
    const posts = await Post.aggregate([
      {
        $match: {
          privacy_status: "public",
          // _id: { $nin: user.post_viewed },
        },
      },
      {
        $sort: { view_count: -1, createdAt: -1 },
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
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] }, // Kiểm tra người dùng đã like chưa
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
            avatar: {
              $ifNull: [
                "$avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
          },
          followedStatus: {
            $cond: {
              if: { $gt: [{ $size: "$followedStatus" }, 0] },
              then: true,
              else: false,
            },
          }, // Kiểm tra người dùng đã follow chưa
        },
      },

      {
        $addFields: {},
      },
      {
        $project: {
          _id: 1,
          author: {
            _id: 1,
            fullname: 1,
            avatar: {
              $ifNull: [
                "$avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
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
        },
      },
    ]);
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

    const totalRecords = await Post.countDocuments({
      privacy_status: "public",
      account_id: { $in: user.following },
      // _id: { $nin: user.post_viewed },
    });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }
    const following = await Follow.find({ follower: user_id })
      .select("following")
      .lean();
    const followingIds = following.map((item) => item.following);

    const posts = await Post.aggregate([
      {
        $match: {
          privacy_status: "public",
          account_id: { $in: followingIds },
          // _id: { $nin: user.post_viewed },
        },
      },
      {
        $sort: { view_count: -1, createdAt: -1 },
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
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] }, // Kiểm tra người dùng đã like chưa
          commentCount: { $size: "$comments" },
          author: {
            _id: "$author._id",
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
            avatar: {
              $ifNull: [
                "author.avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
          },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$$tagUser._id",
                fullname: {
                  $concat: ["$tagUser.first_name", " ", "$tagUser.last_name"],
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
          }, // Kiểm tra người dùng đã follow chưa
        },
      },
      {
        $project: {
          _id: 1,
          author: {
            _id: 1,
            fullname: 1,
            avatar: {
              $ifNull: [
                "$avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
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
        },
      },
    ]);

    if (!posts || posts.length === 0)
      throw new ErrorResponse({
        message: "Post not found",
        code: 404,
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

    const totalRecords = await Post.countDocuments({
      account_id: user_id_view,
    });

    if (!user || !userView)
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });

    const privacy_status =
      user_id === user_id_view ? ["public", "private"] : ["public"];

    const posts = await Post.aggregate([
      {
        $match: {
          account_id: new mongoose.Types.ObjectId(user_id_view),
          privacy_status: { $in: privacy_status },
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
        $addFields: {
          likeCount: { $size: "$like" },
          isLiked: { $in: [new mongoose.Types.ObjectId(user_id), "$like"] }, // Kiểm tra người dùng đã like chưa
          commentCount: { $size: "$comments" },
          tagUsers: {
            $map: {
              input: "$tagUsers",
              as: "tagUser",
              in: {
                _id: "$tagUser._id",
                fullname: {
                  $concat: ["$tagUser.first_name", " ", "$tagUser.last_name"],
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
          }, // Kiểm tra người dùng đã follow chưa
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
            avatar: {
              $ifNull: [
                "$avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
          },
          likeCount: 1,
          isLiked: 1,
          followedStatus: 1,
          commentCount: 1,
        },
      },
    ]);

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

  async getPostDetail({ user_id, post_id }) {
    const post = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(post_id),
        },
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
                _id: "$tagUser._id",
                fullname: {
                  $concat: ["$tagUser.first_name", " ", "$tagUser.last_name"],
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
            avatar: {
              $ifNull: [
                "$avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
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
        },
      },
    ]);

    const comments = await CommentService.getParentCommentByPostId({
      post_id,
      page: 1,
      limit: 10,
      user_id,
    });

    if (!post || post.length === 0)
      throw new ErrorResponse({
        message: "Post not found",
        code: 404,
      });

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

    if (!posts)
      throw new ErrorResponse({
        message: "Post not found",
        code: 400,
      });

    const followedStatus = await Follow.findOne({
      account_id: user_id,
      followings: posts.account_id?._id,
    });

    posts.forEach((post) => {
      post.likeCount = post.like.length;
      post.isLiked = post.like.includes(user_id);
      delete post.like;
      post.followedStatus = followedStatus ? true : false;
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

    if (!posts)
      throw new ErrorResponse({
        message: "Post not found",
        code: 400,
      });

    const followedStatus = await Follow.findOne({
      account_id: user_id,
      followings: posts.account_id?._id,
    });

    posts.forEach((post) => {
      post.likeCount = post.like.length;
      post.isLiked = post.like.includes(user_id);
      delete post.like;
      post.followedStatus = followedStatus ? true : false;
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

  async SuspensionOfPosting({ post_id, reason }) {
    const post = await Post.findOne({ _id: post_id });

    post.violateion.status = true;
    post.violateion.reason = reason;

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
}

module.exports = new PostService();

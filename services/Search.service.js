const { default: mongoose } = require("mongoose");
const User = require("../models/AccountModel");
const Post = require("../models/PostModel");

class SearchService {
  async searchUser({ keyword = "", user_id, _page = 1, _limit = 10 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);

    const total = await User.countDocuments({
      $or: [
        {
          first_name: { $regex: keyword, $options: "i" },
        },
        {
          last_name: { $regex: keyword, $options: "i" },
        },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$first_name", " ", "$last_name"] },
              regex: keyword,
              options: "i",
            },
          },
        },
      ],
      _id: { $ne: new mongoose.Types.ObjectId(user_id) },
    });

    const users = await User.aggregate([
      {
        $match: {
          $or: [
            {
              first_name: { $regex: keyword, $options: "i" },
            },
            {
              last_name: { $regex: keyword, $options: "i" },
            },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$first_name", " ", "$last_name"] },
                  regex: keyword,
                  options: "i",
                },
              },
            },
          ],
          _id: { $ne: new mongoose.Types.ObjectId(user_id) },
        },
      },
      {
        $lookup: {
          from: "follows",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "follow",
        },
      },
      {
        $addFields: {
          fullname: {
            $concat: ["$first_name", " ", "$last_name"],
          },
          isFollowed: {
            $cond: {
              if: { $gt: [{ $size: "$follow" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $skip: (_page - 1) * _limit,
      },
      {
        $limit: _limit,
      },
      {
        $project: {
          fullname: 1,
          isFollowed: 1,
          _id: 1,
          avatar: "$avatar.url",
        },
      },
    ]);

    return {
      list: users,
      page: {
        max: Math.ceil(total / _limit),
        prev: _page > 1,
        next: users.length === _limit,
        limit: _limit,
        current: _page,
      },
    };
  }

  async searchPost({ keyword = "", user_id, _page = 1, _limit = 10 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);

    const total = await Post.countDocuments({
      $and: [
        {
          $or: [
            {
              content: {
                $regex: keyword,
                $options: "i",
              },
            },
            {
              title: {
                $regex: keyword,
                $options: "i",
              },
            },
          ],
        },
        {
          $or: [
            {
              account_id: new mongoose.Types.ObjectId(user_id),
            },
            {
              privacy_status: "public",
            },
          ],
        },
      ],
    });

    const posts = await Post.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  content: {
                    $regex: keyword,
                    $options: "i",
                  },
                },
                {
                  title: {
                    $regex: keyword,
                    $options: "i",
                  },
                },
              ],
            },
            {
              $or: [
                {
                  account_id: new mongoose.Types.ObjectId(user_id),
                },
                {
                  privacy_status: "public",
                },
              ],
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
          pipeline: [
            {
              $addFields: {
                fullname: {
                  $concat: ["$first_name", " ", "$last_name"],
                },
              },
            },
            {
              $project: {
                avatar: "$avatar.url",
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "follows",
          let: {
            user: "$account_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$$user"] },
                  ],
                },
              },
            },
          ],
          as: "follow",
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
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
          pipeline: [
            {
              $addFields: {
                fullname: {
                  $concat: ["$first_name", " ", "$last_name"],
                },
              },
            },
            {
              $project: {
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
          pipeline: [
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          author: 1,
          content: 1,
          title: 1,
          images: 1,
          videos: 1,
          privacy_status: 1,
          createdAt: 1,
          tagUsers: 1,
          hashtags: 1,
          likeCount: {
            $size: "$like",
          },
          followedStatus: {
            $gt: [{ $size: "$follow" }, 0],
          },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(user_id), "$like"],
          },
          commentCount: {
            $size: "$comments",
          },
        },
      },
    ]);

    return {
      list: posts,
      page: {
        max: Math.ceil(total / _limit),
        current: _page,
        next: posts.length === _limit,
        prev: _page > 1,
        limit: _limit,
      },
    };
  }

  async searchHashtag({ keyword = "", user_id, _page = 1, _limit = 10 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);

    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
          pipeline: [
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $match: {
          hashtags: {
            $gt: ["$hashtags", 0],
          },
          $expr: {
            $in: [keyword, "$hashtags.title"],
          },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $addFields: {
                fullname: {
                  $concat: ["$first_name", " ", "$last_name"],
                },
              },
            },
            {
              $project: {
                avatar: "$avatar.url",
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "follows",
          let: {
            user: "$account_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$follower", new mongoose.Types.ObjectId(user_id)],
                    },
                    { $eq: ["$following", "$$user"] },
                  ],
                },
              },
            },
          ],
          as: "follow",
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
          from: "accounts",
          localField: "tagUsers",
          foreignField: "_id",
          as: "tagUsers",
          pipeline: [
            {
              $addFields: {
                fullname: {
                  $concat: ["$first_name", " ", "$last_name"],
                },
              },
            },
            {
              $project: {
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          author: 1,
          content: 1,
          title: 1,
          images: 1,
          videos: 1,
          privacy_status: 1,
          createdAt: 1,
          tagUsers: 1,
          hashtags: 1,
          likeCount: {
            $size: "$like",
          },
          followedStatus: {
            $gt: [{ $size: "$follow" }, 0],
          },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(user_id), "$like"],
          },
          commentCount: {
            $size: "$comments",
          },
        },
      },
    ]);

    return {
      list: posts,
    };
  }
}

module.exports = new SearchService();

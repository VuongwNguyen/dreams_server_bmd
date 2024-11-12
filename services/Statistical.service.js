const User = require("../models/AccountModel");
const Post = require("../models/PostModel");
const Report = require("../models/ReportModel");

class StatisticalService {
  async getInfos() {
    const countUsers = await User.countDocuments({});
    const countPosts = await Post.countDocuments({});
    const countReports = await Report.countDocuments({});
    const countViolators = await User.countDocuments({
      isJudged: { $ne: null },
    });

    return {
      users: countUsers,
      posts: countPosts,
      reports: countReports,
      violators: countViolators,
    };
  }

  async getCelebrities({
    _page = 1,
    _limit = 10,
    _sort = -1,
    sort_type = "celebrity",
  }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);
    _sort = parseInt(_sort);

    const skip = (_page - 1) * _limit;
    const total = await User.countDocuments({ isJudged: { $eq: null } });

    const sortStage = {
      $sort: {},
    };

    switch (sort_type) {
      case "celebrity": {
        sortStage.$sort.count_follower = _sort;
        break;
      }
      case "post": {
        sortStage.$sort.count_post = _sort;
        break;
      }
      case "all": {
        sortStage.$sort.total = _sort;
        break;
      }

      default: {
        sortStage.$sort.count_follower = _sort;
      }
    }

    const users = await User.aggregate([
      {
        $match: {
          isJudged: {
            $eq: null,
          },
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "following",
          as: "followers",
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "account_id",
          as: "posteds",
        },
      },
      {
        $addFields: {
          count_follower: {
            $size: "$followers",
          },
          count_post: {
            $size: "$posteds",
          },
          total: {
            $sum: [
              {
                $size: "$followers",
              },
              {
                $size: "$posteds",
              },
            ],
          },
        },
      },
      sortStage,
      {
        $skip: skip,
      },
      {
        $limit: _limit,
      },
      {
        $project: {
          count_follower: 1,
          count_post: 1,
          fullname: {
            $concat: ["$first_name", " ", "$last_name"],
          },
          avatar: "$avatar.url",
          total: 1,
        },
      },
    ]);

    return {
      list: users,
      page: {
        limit: _limit,
        max: Math.ceil(total / _limit),
        current: _page,
        next: users.length === _limit && _page !== Math.ceil(total / _limit),
        prev: _page > 1,
      },
    };
  }
}

module.exports = new StatisticalService();

const { default: mongoose } = require("mongoose");
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
    ban = 0,
  }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);
    _sort = parseInt(_sort);
    ban = parseInt(ban);

    let sortStage = {
      $sort: {},
    };

    let matchStage = {
      isJudged: {
        $eq: null,
      },
    };

    if (ban === 1) {
      matchStage = {
        isJudged: {
          $ne: null,
        },
      };
    } else if (ban === 2) {
      matchStage = {};
    }

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

    const skip = (_page - 1) * _limit;
    const total = await User.countDocuments(matchStage);

    const users = await User.aggregate([
      {
        $match: matchStage,
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
        $lookup: {
          from: "reports",
          localField: "_id",
          foreignField: "reported_content_id",
          as: "count_reports",
        },
      },
      {
        $lookup: {
          from: "reports",
          localField: "posteds._id",
          foreignField: "reported_content_id",
          as: "count_post_reports",
        },
      },
      {
        $addFields: {
          count_pending_post_report: {
            $filter: {
              input: "$count_post_reports",
              as: "temp",
              cond: { $eq: ["$$temp.status", "pending"] },
            },
          },
          count_resolved_post_report: {
            $filter: {
              input: "$count_post_reports",
              as: "temp",
              cond: { $eq: ["$$temp.status", "resolved"] },
            },
          },
          count_rejected_post_report: {
            $filter: {
              input: "$count_post_reports",
              as: "temp",
              cond: { $eq: ["$$temp.status", "rejected"] },
            },
          },
          count_pending_account_report: {
            $filter: {
              input: "$count_reports",
              as: "temp",
              cond: { $eq: ["$$temp.status", "pending"] },
            },
          },
          count_resolved_account_report: {
            $filter: {
              input: "$count_reports",
              as: "temp",
              cond: { $eq: ["$$temp.status", "resolved"] },
            },
          },
          count_rejected_account_report: {
            $filter: {
              input: "$count_reports",
              as: "temp",
              cond: { $eq: ["$$temp.status", "rejected"] },
            },
          },
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
          count_total_report: {
            $sum: [
              { $size: "$count_reports" },
              { $size: "$count_post_reports" },
            ],
          },
          count_pending_report: {
            $sum: [
              { $size: "$count_pending_post_report" },
              { $size: "$count_pending_account_report" },
            ],
          },
          count_rejected_report: {
            $sum: [
              { $size: "$count_rejected_post_report" },
              { $size: "$count_rejected_account_report" },
            ],
          },
          count_resolved_report: {
            $sum: [
              { $size: "$count_resolved_post_report" },
              { $size: "$count_resolved_account_report" },
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
          count_total_report: 1,
          count_pending_report: 1,
          count_rejected_report: 1,
          count_resolved_report: 1,
          count_follower: 1,
          count_post: 1,
          fullname: {
            $concat: ["$first_name", " ", "$last_name"],
          },
          email: 1,
          createdAt: 1,
          avatar: "$avatar.url",
          isBanned: {
            $cond: {
              if: { $eq: ["$isJudged", null] },
              then: false,
              else: true,
            },
          },
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

  async getPostsByUser({ user_id, _page = 1, _limit = 10, _sort = -1 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);
    _sort = parseInt(_sort);

    const skip = (_page - 1) * _limit;
    const total = await Post.countDocuments({ account_id: user_id });

    const posts = await Post.aggregate([
      {
        $match: {
          account_id: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "account",
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
        $unwind: "$account",
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
        $addFields: {
          count_comment: {
            $size: "$comments",
          },
          count_like: {
            $size: "$like",
          },
        },
      },
      {
        $sort: {
          createdAt: _sort,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: _limit,
      },
      {
        $project: {
          title: 1,
          content: 1,
          createdAt: 1,
          count_comment: 1,
          images: {
            url: 1,
            _id: 1,
          },
          videos: {
            url: 1,
            _id: 1,
          },
          author: {
            fullname: {
              $concat: ["$account.first_name", " ", "$account.last_name"],
            },
            avatar: "$account.avatar.url",
          },
        },
      },
    ]);

    return {
      list: posts,
      page: {
        limit: _limit,
        max: Math.ceil(total / _limit),
        current: _page,
        next: posts.length === _limit && _page !== Math.ceil(total / _limit),
        prev: _page > 1,
      },
    };
  }
}

module.exports = new StatisticalService();

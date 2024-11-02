const { Follow, Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const mongoose = require("mongoose");
const { usersOnline } = require("../socket");
const NotificationService = require("./Notification.service");

class FollowService {
  async toggleFollowUser({ user_id, following }) {
    const checkUser = await Account.findOne({ _id: user_id }).lean();
    const checkFollowingUser = await Account.findOne({ _id: following }).lean();

    if (!checkUser || !checkFollowingUser)
      throw new ErrorResponse({
        message: "User not found",
        code: 404,
      });

    const checkFollow = await Follow.findOne({
      follower: user_id,
      following: following,
    });

    if (checkFollow) {
      const Unfollow = await Follow.deleteOne({
        follower: user_id,
        following: following,
      });

      if (!Unfollow)
        throw new ErrorResponse({
          message: "Unfollow failed",
          status: 400,
        });

      return {
        message: "Unfollowed successfully",
        data: { folloStatus: false },
      };
    } else {
      const follow = await Follow.create({
        follower: user_id,
        following: following,
      });

      if (!follow)
        throw new ErrorResponse({
          message: "Follow failed",
          status: 400,
        });

      await NotificationService.createNotification({
        receiver: following,
        sender: user_id,
        type: "follow",
      });

      return {
        message: "Followed successfully",
        data: { followStatus: true },
      };
    }
  }

  async getFollowings({ user_id, _page = 1, _limit = 10 }) {
    if (!user_id_view) user_id_view = user_id;
    if (!_page || _page < 1) _page = 1;
    if (!_limit || _limit < 10) _limit = 10;
    const followings = await Follow.aggregate([
      {
        $match: {
          follower: new mongoose.Types.ObjectId(user_id_view),
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "following",
          foreignField: "_id",
          as: "following",
        },
      },
      {
        $unwind: "$following",
      },
      {
        $addFields: {
          fullname: {
            $concat: ["$following.first_name", " ", "$following.last_name"],
          },
          avatar: "$following.avatar.url",
          isSelf: {
            $eq: ["$following._id", new mongoose.Types.ObjectId(user_id)],
          },
        },
      },
      {
        $skip: (+_page - 1) * +_limit, // Phân trang
      },
      {
        $limit: +_limit, // Giới hạn số lượng kết quả
      },
    ]).exec();

    const totalRecords = await Follow.countDocuments({
      follower: new mongoose.Types.ObjectId(user_id_view),
    });

    for (const following of followings) {
      following.isFollowing = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(user_id),
        following: following.user._id,
      }).then((count) => count > 0);
    }

    return {
      list: followings,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: +_page,
        limit: +_limit,
        hasNext: followings.length === +_limit,
        hasPrevious: +_page > 1,
      },
    };
  }

  async getFollowers({ user_id, user_id_view, _page = 1, _limit = 10 }) {
    if (!user_id_view) user_id_view = user_id;
    if (!_page || _page < 1) _page = 1;
    if (!_limit || _limit < 10) _limit = 10;

    const followers = await Follow.aggregate([
      {
        $match: {
          following: new mongoose.Types.ObjectId(user_id_view),
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "follower",
          foreignField: "_id",
          as: "follower",
        },
      },
      {
        $unwind: "$follower",
      },
      {
        $addFields: {
          fullname: {
            $concat: ["$follower.first_name", " ", "$follower.last_name"],
          },
          avatar: "$follower.avatar.url",
          isSelf: {
            $eq: ["$follower._id", new mongoose.Types.ObjectId(user_id)],
          },
        },
      },
      {
        $skip: (_page - 1) * _limit,
      },
      {
        $limit: +_limit,
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: "$follower._id",
            fullname: "$fullname",
            avatar: "$avatar",
          },
          isFollowing: {
            $cond: {
              if: {
                $eq: ["$follower._id", new mongoose.Types.ObjectId(user_id)],
              },
              then: "$$REMOVE",
              else: true,
            },
          },
          isSelf: 1,
        },
      },
    ]);

    const totalRecords = await Follow.countDocuments({
      following: new mongoose.Types.ObjectId(user_id_view),
    });

    for (const follower of followers) {
      follower.isFollowing = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(user_id),
        following: follower.user._id,
      }).then((count) => count > 0);
    }

    return {
      list: followers,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: +_page,
        limit: +_limit,
        hasNext: followers.length === +_limit,
        hasPrevious: _page > 1,
      },
    };
  }

  async getFollowingsForChat({ user_id, _page = 1, _limit = 20 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);

    const total = await Follow.countDocuments({ follower: user_id });

    let followings = await Follow.aggregate([
      {
        $match: {
          follower: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "following",
          foreignField: "_id",
          as: "following",
        },
      },
      {
        $unwind: "$following",
      },
      {
        $skip: (_page - 1) * _limit,
      },
      {
        $limit: _limit,
      },
      {
        $project: {
          _id: "$following._id",
          fullname: {
            $concat: ["$following.first_name", " ", "$following.last_name"],
          },
          avatar: "$following.avatar.url",
          isOnline: {
            $in: [
              "$following._id",
              Object.values(usersOnline).map(
                (user) => new mongoose.Types.ObjectId(user.user_id)
              ),
            ],
          },
        },
      },
    ]);

    if (followings.length < 3) {
      followings = await Account.aggregate([
        {
          $limit: _limit,
        },
        {
          $skip: (_page - 1) * _limit,
        },
        {
          $project: {
            fullname: {
              $concat: ["$first_name", " ", "$last_name"],
            },
            avatar: "$avatar.url",
            isOnline: {
              $in: [
                "$_id",
                Object.values(usersOnline).map(
                  (user) => new mongoose.Types.ObjectId(user.user_id)
                ),
              ],
            },
          },
        },
      ]);
    }

    return {
      list: followings,
      page: {
        limit: _limit,
        current: _page,
        next: followings.length === _limit,
        prev: _page > 1,
        max: Math.ceil(total / _limit),
      },
    };
  }
}

module.exports = new FollowService();

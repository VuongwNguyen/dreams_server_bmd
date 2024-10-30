const { Follow, Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const mongoose = require("mongoose");
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

  async getFollowings({ user_id, user_id_view, _page = 1, _limit = 10 }) {
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
        $skip: (_page - 1) * _limit,
      },
      {
        $limit: +_limit,
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$following._id",
            fullname: "$fullname",
            avatar: "$avatar",
          },
          isFollowing: {
            $cond: {
              if: {
                $eq: ["$following._id", new mongoose.Types.ObjectId(user_id)],
              },
              then: "$$REMOVE",
              else: true,
            },
          },
          isSelf: 1,
        },
      },
    ]);

    for (const following of followings) {
      following.isFollowing = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(user_id),
        following: following.user._id,
      }).then((count) => count > 0);

      const totalRecords = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(user_id_view),
      });

      return {
        list: followings,
        page: {
          maxPage: Math.ceil(totalRecords / _limit),
          currentPage: +_page,
          limit: _limit,
          hasNext: followings.length === _limit,
          hasPrevious: _page > 1,
        },
      };
    }
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
          follower: {
            _id: "$follower._id",
            fullname: "$fullname",
            avatar: "$avatar",
          },
        },
      },
    ]);

    const totalRecords = await Follow.countDocuments({
      following: new mongoose.Types.ObjectId(user_id_view), 
    });


    const isFollowing = await Follow.exists({
      follower: new mongoose.Types.ObjectId(user_id), 
      following: new mongoose.Types.ObjectId(user_id_view),
    });

    const isFollowingValue = !!isFollowing; 

    followers.forEach((follower) => {
      follower.isFollowing = isFollowingValue; 
    });

    return {
      list: followers,
      page: {
        maxPage: Math.ceil(totalRecords / _limit), 
        currentPage: +_page, 
        limit: +_limit, 
        hasNext: followers.length === _limit,
        hasPrevious: _page > 1, 
      },
    };
  }
}

module.exports = new FollowService();

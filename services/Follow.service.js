const { Follow, Account } = require("../models");

const { ErrorResponse } = require("../core/reponseHandle");
const mongoose = require("mongoose");

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

      return {
        message: "Followed successfully",
      };
    }
  }

  async getFollowings({ user_id, _page = 1, _limit = 10 }) {
    const followings = await Follow.aggregate([
      {
        $match: {
          follower: new mongoose.Types.ObjectId(user_id), // Lọc tất cả các bản ghi mà user_id đang follow người khác
        },
      },
      {
        $lookup: {
          from: "accounts", // Nối với collection users để lấy thông tin người dùng
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
          following:{
            fullname: "$following.fisrt_name $following.last_name",
          }
        }
      },
      {
        $skip: (_page - 1) * _limit, // Phân trang
      },
      {
        $limit: _limit, // Giới hạn số lượng kết quả
      },
    ]).exec();
    

    const totalRecords = await Follow.countDocuments({
      follower: new mongoose.Types.ObjectId(user_id),
    });

    if (!followings)
      throw new ErrorResponse({ message: "User not found", status: 404 });

    return {
      list: followings,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: _page,
        limit: _limit,
        hasNext: followings.length === _limit,
        hasPrevious: _page > 1,
      },
    };
  }

  async getFollowers({ user_id, _page = 1, _limit = 10 }) {
    const followers = await Follow.aggregate([
      {
        $match: {
          following: mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "follower",
          foreignField: "_id",
          as: "follower",
        },
      },
      {
        $unwind: "$follower",
      },
      {
        $project: {
          follower: {
            _id: 1,
            username: 1,
            avatar: 1,
          },
        },
      },
      {
        $skip: (_page - 1) * _limit,
      },
      {
        $limit: _limit,
      },
    ]).explain("executionStats");

    const totalRecords = await Follow.countDocuments({
      following: mongoose.Types.ObjectId(user_id),
    });

    if (!followers)
      throw new ErrorResponse({ message: "User not found", status: 404 });

    return {
      list: followers,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: _page,
        limit: _limit,
        hasNext: followers.length === _limit,
        hasPrevious: _page > 1,
      },
    };
  }
}

module.exports = new FollowService();

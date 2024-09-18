const User = require("../models/AccountModel");
const Follow = require("../models/FollowModel");
const { ErrorResponse } = require("../core/reponseHandle");

class FollowService {
  async followUser({ userId, followingUserId }) {
    const user = await User.findOne({ _id: userId }).lean();
    const followingUser = await User.findOne({ _id: followingUserId }).lean();

    if (!user && !followingUser) {
      throw new ErrorResponse({ message: "Users not found" });
    }

    const follow = await Follow.create({
      follower: userId,
      following: followingUserId,
    });

    return follow;
  }

  async unfollowUser({ userId, followingUserId }) {
    const user = await User.findOne({ _id: userId }).lean();
    const followingUser = await User.findOne({ _id: followingUserId }).lean();

    if (!user && !followingUser) {
      throw new ErrorResponse({ message: "Users not found" });
    }
    const follow = await Follow.findOneAndDelete({
      follower: userId,
      following: followingUserId,
    });

    return follow;
  }

  async checkFollowStatus({ userId, followingUserId }) {
    const user = await User.findOne({ _id: userId }).lean();
    const followingUser = await User.findOne({ _id: followingUserId }).lean();

    if (!user && !followingUser) {
      throw new ErrorResponse({ message: "Users not found" });
    }

    const followStatus = await Follow.findOne({
      follower: userId,
      following: followingUserId,
    }).lean();

    return followStatus ? true : false;
  }

  async getFollowings({ userId, _page = 1, _limit = 10 }) {
    const user = await User.findOne({ _id: userId }).lean();

    if (_page < 1) _page = 1; // 
    if (_limit < 10) _limit = 10;

    if (!user) {
      throw new ErrorResponse({ message: "User not found" });
    }

    const totalRecords = await Follow.countDocuments({ follower: userId });
    const _skip = (_page - 1) * _limit;

    const following = await Follow.find({ follower: userId })
      .select("following")
      .skip(_skip)
      .limit(_limit)
      .lean();

    return {
      list: following,
      page: {
        maxPage: Math.ceil(totalRecords / _limit),
        currentPage: _page,
        limit: _limit,
        hasNext: following.length === _limit,
        hasPrevious: _page > 1,
      },
    };
  }

  async getFollowers({ userId, _page = 1, _limit = 10 }) {
    const user = await User.findOne({ _id: userId }).lean();

    if (_page < 1) _page = 1;
    if (_limit < 10) _limit = 10;

    if (!user) {
      throw new ErrorResponse({ message: "User not found" });
    }

    const totalRecords = await Follow.countDocuments({ following: userId });
    const _skip = (_page - 1) * _limit;

    const followers = await Follow.find({ following: userId })
      .select("follower")
      .skip(_skip)
      .limit(_limit)
      .lean();

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

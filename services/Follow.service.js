const { Follow } = require("../models");
const { ErrorResponse } = require("../core/responseHandle");

class FollowService {
  async follow({ follower, following }) {
    if (follower.toString() === following.toString()) {
      throw new ErrorResponse({
        message: "You can't follow yourself",
        code: 400,
      });
    }

    const follow = await Follow.findOne({
      follower,
      following,
    });

    if (follow) {
      throw new ErrorResponse({
        message: "Already following",
        code: 400,
      });
    }
    const newFollow = Follow.create({ follower, following });
    if (!newFollow) {
      throw new ErrorResponse({
        message: "Failed to follow",
        code: 400,
      });
    }
    return newFollow;
  }

  async unfollow({ follower, following }) {
    const follow = await Follow.findOneAndDelete({
      follower,
      following,
    });

    if (!follow) {
      throw new ErrorResponse({
        message: "Not following",
        code: 400,
      });
    }
    return follow;
  }

  async getFollowers({ userId }) {
    const followers = await Follow.find({ following: userId }).populate(
      "follower"
    );
    return followers;
  }

  async getFollowing({ userId }) {
    const following = await Follow.find({ follower: userId }).populate(
      "following"
    );
    return following;
  }
}
module.exports = new FollowService();

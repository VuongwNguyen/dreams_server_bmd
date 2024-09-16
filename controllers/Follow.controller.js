const FollowService = require("../services/Follow.service");
const { SuccessfullyResponse } = require("../core/responseHandle");

class FollowController {
  async follow(req, res) {
    const { user } = req;
    const { following } = req.body;
    await FollowService.follow({
      follower: user._id,
      following,
    });
    new SuccessfullyResponse({
      message: "Successfully followed",
    }).json(res);
  }

  async unfollow(req, res) {
    const { user } = req;
    const { following } = req.body;
    await FollowService.unfollow({
      follower: user._id,
      following,
    });
    new SuccessfullyResponse({
      message: "Successfully unfollowed",
    }).json(res);
  }

  async getFollowers(req, res) {
    const { user } = req;
    const followers = await FollowService.getFollowers({
      userId: user._id,
    });
    new SuccessfullyResponse({
      message: "Successfully get followers",
      data: { followers },
    }).json(res);
  }

  async getFollowing(req, res) {
    const { user } = req;
    const following = await FollowService.getFollowing({
      userId: user._id,
    });
    new SuccessfullyResponse({
      message: "Successfully get following",
      data: { following },
    }).json(res);
  }
}

module.exports = new FollowController();

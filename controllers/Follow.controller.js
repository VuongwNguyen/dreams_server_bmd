const FollowService = require("../services/Follow.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class FollowController {
  async toggleFollowUser(req, res) {
    const { user_id } = req.user;
    const { following } = req.body;

    const result = await FollowService.toggleFollowUser({
      user_id,
      following,
    });

    return new SuccessfullyReponse({
      data: null,
      message: result.message,
    }).json(res);
  }

  async getFollowings(req, res) {
    const { user_id } = req.user;
    const { _page, _limit } = req.query;

    const followings = await FollowService.getFollowings({
      user_id,
      _page,
      _limit,
    });
    

    return new SuccessfullyReponse({
      data: followings,
      message: "Get followings successfully",
    }).json(res);
  }
}

module.exports = new FollowController();

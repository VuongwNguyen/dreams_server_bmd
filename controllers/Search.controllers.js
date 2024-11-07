const { SuccessfullyReponse } = require("../core/reponseHandle");
const SearchService = require("../services/Search.service");

class SearchController {
  async searchUser(req, res) {
    const { keyword, _page, _limit } = req.query;
    const { user_id } = req.user;

    new SuccessfullyReponse({
      message: "get users success",
      data: await SearchService.searchUser({ keyword, user_id, _limit, _page }),
    }).json(res);
  }

  async searchPost(req, res) {
    const { keyword, _page, _limit } = req.query;
    const { user_id } = req.user;

    new SuccessfullyReponse({
      message: "get posts success",
      data: await SearchService.searchPost({ keyword, user_id, _limit, _page }),
    }).json(res);
  }

  async searchHashtag(req, res) {
    const { keyword, _page, _limit } = req.query;
    const { user_id } = req.user;

    new SuccessfullyReponse({
      message: "get post by hashtag success",
      data: await SearchService.searchHashtag({
        keyword,
        _page,
        _limit,
        user_id,
      }),
    }).json(res);
  }
}

module.exports = new SearchController();

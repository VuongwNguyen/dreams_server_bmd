const { SuccessfullyReponse } = require("../core/reponseHandle");
const StatisticalService = require("../services/Statistical.service");

class StatisticalController {
  async getInfos(req, res) {
    new SuccessfullyReponse({
      message: "get infos success",
      data: await StatisticalService.getInfos(),
    }).json(res);
  }

  async getCelebrities(req, res) {
    const { _page, _limit, _sort, sort_type, ban } = req.query;

    new SuccessfullyReponse({
      message: "get celebrities success",
      data: await StatisticalService.getCelebrities({
        _page,
        _limit,
        _sort,
        sort_type,
        ban,
      }),
    }).json(res);
  }

  async getPostsByUser(req, res) {
    const { user_id, _page, _limit, _sort } = req.query;
    new SuccessfullyReponse({
      message: "get posts by user success",
      data: await StatisticalService.getPostsByUser({
        user_id,
        _page,
        _limit,
        _sort,
      }),
    }).json(res);
  }
}

module.exports = new StatisticalController();

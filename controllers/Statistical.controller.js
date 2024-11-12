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
    const { _page, _limit, _sort, sort_type } = req.query;

    new SuccessfullyReponse({
      message: "get celebrities success",
      data: await StatisticalService.getCelebrities({
        _page,
        _limit,
        _sort,
        sort_type,
      }),
    }).json(res);
  }
}

module.exports = new StatisticalController();

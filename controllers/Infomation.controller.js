const InfomationService = require("../services/Infomation.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class InfomationController {
  async upSertInfomation(req, res, next) {
    const { user_id } = req.user;
    const { key, value, privacy_status } = req.body;
    const result = await InfomationService.upSertInfomation({
      user_id,
      payload: { key, value, privacy_status },
    });
    return new SuccessfullyReponse({
      data: result,
      message: "Update infomation successfully",
    }).json(res);
  }

  async getInfomation(req, res, next) {
    const { user_id } = req.user;
    const { user_id_view } = req.query;
    const result = await InfomationService.getInfomation({ user_id, user_id_view });
    return new SuccessfullyReponse({
      data: result,
      message: "Get infomation successfully",
    }).json(res);
  }

  async getInfomationList(req, res, next) {
    const { user_id } = req.user;
    const { user_id_view } = req.query;
    const result = await InfomationService.getInfomationList({ user_id, user_id_view });
    return new SuccessfullyReponse({
      data: result,
      message: "Get infomation list successfully",
    }).json(res);
  }

  async getInfomationBySelfSetting(req, res, next) {
    const { user_id } = req.user;
    const result = await InfomationService.getInfomationBySelfSetting({ user_id });
    return new SuccessfullyReponse({
      data: result,
      message: "Get infomation by self setting successfully",
    }).json(res);
  }
}

module.exports = new InfomationController();

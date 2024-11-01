const { SuccessfullyReponse } = require("../core/reponseHandle");
const SendNotificationService = require("../services/SendNotification.service");

class TestController {
  async sendNoti(req, res, next) {
    const { user_id } = req.user;

    await SendNotificationService.sendNotification(user_id, {
      data: {
        chat: JSON.stringify(["First", "Second", "Third"]),
      },
    });

    new SuccessfullyReponse({
      message: "send success",
    }).json(res);
  }
}

module.exports = new TestController();

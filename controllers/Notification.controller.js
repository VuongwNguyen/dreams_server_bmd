const NotificationService = require("../services/Notification.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class NotificationController {
  async getNotifications(req, res, next) {
    const { user_id } = req.user;
    const { _limit, _page, type } = req.query;
    const notifications = await NotificationService.getNotifications({
      receiver: user_id,
      _limit,
      _page,
      type,
    });
    return new SuccessfullyReponse({
      data: notifications,
      message: "Get notifications successfully",
    }).json(res);
  }

  async detailNotification(req, res, next) {
    const { notification_id } = req.params;
    await NotificationService.detailNotification({ notification_id });
    return new SuccessfullyReponse({
      data: null,
      message: "Read notification successfully",
    }).json(res);
  }

  async toggleNotification(req, res, next) {
    const { user_id } = req.user;
    const status = await NotificationService.toggleNotification({ user_id });
    return new SuccessfullyReponse({
      data: status.toggleNotification,
      message: status.message,
    }).json(res);
  }
}

module.exports = new NotificationController();

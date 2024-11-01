const NotificationService = require("../services/Notification.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class NotificationController {
  async getNotifications(req, res, next) {
    const { user_id } = req.user;
    const { _limit, _page } = req.query;
    const notifications = await NotificationService.getNotifications({
      receiver: user_id,
      _limit,
      _page,
    });
    return new SuccessfullyReponse({
      data: notifications,
      message: "Get notifications successfully",
    }).json(res);
  }

  async detailNotification(req, res, next) {
    const { notification_id } = req.params;
    const notification = await NotificationService.detailNotification({
      notification_id,
    });
    return new SuccessfullyReponse({
      data: notification,
      message: "Get notification detail successfully",
    }).json(res);
  }
}

module.exports = new NotificationController();

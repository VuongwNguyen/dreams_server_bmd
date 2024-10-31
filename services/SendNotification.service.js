const { messaging } = require("firebase-admin");
const User = require("../models/AccountModel");

class SendNotificationService {
  static DEFAULT_NOTIFICATION = {
    android: {
      priority: "high",
    },
  };

  async sendNotification(user_id, message = {}) {
    const user = await User.findOne({ _id: user_id }).lean();

    if (!user) {
      return "user not exist";
    }

    if (!user.fcm_token) {
      return "fcm not registered";
    }

    try {
      console.log("send single noti");
      await messaging().send({
        ...SendNotificationService.DEFAULT_NOTIFICATION,
        ...message,
        token: user.fcm_token,
      });
    } catch (e) {
      console.log("error when send notification", e);
      throw new Error("Error when try send notification");
    }
  }

  async sendBroastCastNotification(user_ids = [], message = {}) {
    const users = await User.find({
      _id: { $in: user_ids },
      fcm_token: { $ne: null },
    }).lean();

    if (users.length <= 0) {
      return;
    }

    try {
      console.log("send noti broast cast");
      await messaging().sendEachForMulticast({
        tokens: users.reduce((accum, curr) => {
          if (curr.fcm_token) {
            accum.push(curr.fcm_token);
          }

          return accum;
        }, []),
        ...SendNotificationService.DEFAULT_NOTIFICATION,
        ...message,
      });
    } catch (e) {
      console.log("error when send multicast notification", e);
      throw new Error("Error when try send notification");
    }
  }
}

module.exports = new SendNotificationService();

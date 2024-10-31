const { default: mongoose } = require("mongoose");
const { Notification } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");

class NotificationService {
  async createNotification({ receiver, sender, type, post_id, comment_id }) {
    const notification = await Notification.create({
      receiver,
      sender,
      type,
      post_id,
      comment_id,
    });
    return notification;
  }

  async getNotifications({ receiver, _limit, _page }) {
    if (!_limit || _limit < 10) _limit = 10;
    if (!_page || _page < 1) _page = 1;

    const notifications = await Notification.aggregate([
      { $match: { receiver: new mongoose.Types.ObjectId(receiver) } },
      { $sort: { createdAt: -1 } },
      {
        $skip: (+_page - 1) * +_limit,
      },
      {
        $limit: +_limit,
      },
      {
        $lookup: {
          from: "accounts",
          localField: "sender",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "post_id",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "comment_id",
          foreignField: "_id",
          as: "comment",
        },
      },
      { $unwind: "$sender" },
      {
        $addFields: {
          notificationData: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$type", "post"] },
                  then: {
                    sender: "$sender",
                    post: { $arrayElemAt: ["$post", 0] },
                    type: "post",
                  },
                },
                {
                  case: { $eq: ["$type", "like"] },
                  then: {
                    sender: "$sender",
                    post: { $arrayElemAt: ["$post", 0] },
                    type: "like",
                  },
                },
                {
                  case: { $eq: ["$type", "comment"] },
                  then: {
                    sender: "$sender",
                    comment: { $arrayElemAt: ["$comment", 0] },
                    post: { $arrayElemAt: ["$post", 0] },
                    type: "comment",
                  },
                },
                {
                  case: { $eq: ["$type", "mention"] },
                  then: {
                    sender: "$sender",
                    comment: { $arrayElemAt: ["$comment", 0] },
                    type: "mention",
                  },
                },
                {
                  case: { $eq: ["$type", "follow"] },
                  then: {
                    sender: "$sender",
                    type: "follow",
                  },
                },
              ],
              default: null,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          receiver: 1,
          is_read: 1,
          createdAt: 1,
          sender: {
            fullname: {
              $concat: ["$sender.first_name", " ", "$sender.last_name"],
            },
            avatar: "$sender.avatar.url",
            _id: "$sender._id",
          },
          type: "$notificationData.type",
        },
      },
    ]);

    return {
      data: notifications,
      page: {
        maxPage: Math.ceil(notifications.length / _limit),
        currentPage: _page,
        limit: +_limit,
        hasNext: notifications.length === +_limit,
        hasPrevious: +_page > 1,
      },
    };
  }

  async detailNotification({ notification_id }) {
    const notification = await Notification.findById(notification_id);

    if (!notification)
      throw new ErrorResponse({
        message: "Notification not found",
        status: 400,
      });

    notification.is_read = true;
    await notification.save();

    if (notification.type !== "follow") {
      return {
        post_id: notification.post_id,
        message: "Notification is a post",
      };
    } else {
      return {
        sender_id: notification.sender,
        message: "Notification is a follow",
      };
    }
  }
}

module.exports = new NotificationService();

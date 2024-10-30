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

  async getNotifications({ receiver }) {
    const notifications = await Notification.aggregate([
      { $match: { receiver: new mongoose.Types.ObjectId(receiver) } },
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
              $concat: [
                "$notificationData.sender.first_name",
                " ",
                "$notificationData.sender.last_name",
              ],
            },
            avatar: "$notificationData.sender.avatar.url",
            _id: "$notificationData.sender._id",
          },
          type: "$notificationData.type",
        },
      },
    ]);

    return notifications;
  }

  async detailNotification({ notification_id }) {
    const PostService = require("./Post.service");

    const notification = await Notification.findById(notification_id);

    if (!notification)
      throw new ErrorResponse({
        message: "Notification not found",
        status: 404,
      });

    if (notification.type !== "follow") {
      const post = await PostService.getPostDetail({
        user_id: notification.receiver,
        post_id: notification.post_id,
      });
      return post;
    } else {
      throw new ErrorResponse({
        message: "Missing get notification detail",
        status: 401,
      });
    }
  }
}

module.exports = new NotificationService();

const { default: mongoose } = require("mongoose");
const { Notification, Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const SendNotificationService = require("./SendNotification.service");

class NotificationService {
  async createNotification({ receiver, sender, type, post_id, comment_id }) {
    console.log("post_id", post_id);
    const notification = await Notification.create({
      receiver,
      sender,
      type,
      post_id,
      comment_id,
    });
    const user = await Account.findById(sender);

    const body = () => {
      switch (type) {
        case "post":
          return `${user.first_name} ${user.last_name} has created a new post`;
        case "like":
          return `${user.first_name} ${user.last_name} has liked your post`;
        case "comment":
          return `${user.first_name} ${user.last_name} has commented on your post`;
        case "mention":
          return `${user.first_name} ${user.last_name} has mentioned you in a post`;
        case "follow":
          return `${user.first_name} ${user.last_name} has followed you`;
        default:
          return "";
      }
    };

    await SendNotificationService.sendNotification(receiver, {
      notification: {
        title: "Dreams Social Network",
        body: body(),
      },
    });
    return notification;
  }

  async getNotifications({ receiver, _limit, _page, type = all }) {
    if (!_limit || _limit < 10) _limit = 10;
    if (!_page || _page < 1) _page = 1;

    const totalCount = await Notification.countDocuments({
      receiver: new mongoose.Types.ObjectId(receiver),
    });
    let sortStage;

    if (type === "all") {
      sortStage = {
        $sort: {
          createdAt: -1,
        },
      }; // Bỏ qua `is_read` cho type = 'all'
    } else if (type === "unread") {
      sortStage = {
        $sort: {
          is_read: 1, // `is_read: true` (1) sẽ được xếp cuối, đưa `true` lên trước
          createdAt: -1,
        },
      };
    } else if (type === "read") {
      sortStage = {
        $sort: {
          is_read: -1, // `is_read: false` (0) sẽ được xếp đầu, đưa `false` lên trước
          createdAt: -1,
        },
      };
    }

    const notifications = await Notification.aggregate([
      {
        $match: { receiver: new mongoose.Types.ObjectId(receiver) },
      },
      { ...sortStage },
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
          post_id: 1,
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
        maxPage: Math.ceil(totalCount / _limit),
        currentPage: +_page,
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
    return await notification.save();
  }
}

module.exports = new NotificationService();

const Message = require("../models/MessageModel");
const Room = require("../models/RoomModel");
const { ErrorResponse } = require("../core/reponseHandle");
const mongoose = require("mongoose");
const SendNotificationService = require("./SendNotification.service");
const { Account } = require("../models");
const ObjectId = mongoose.Types.ObjectId;

class MessageService {
  async createMessage({ message, images, replied_id, room_id, author }) {
    let mess = await Message.create({
      content: message,
      images,
      replied_id,
      room_id,
      author,
    });

    await mess.populate("author", "first_name last_name avatar.url");
    if (replied_id) {
      await mess.populate("replied_id", "images author content send_at");
      await mess.populate("replied_id.author", "first_name last_name");
    }

    mess = mess.toObject();

    if (mess?.replied_id?.author) {
      mess.replied_id = {
        author: {
          _id: mess.replied_id.author._id,
          fullname: `${mess.replied_id.author.first_name} ${mess.replied_id.author.last_name}`,
        },
        _id: mess.replied_id._id,
        send_at: mess.replied_id.send_at,
        content: mess.replied_id.content,
        images: mess.replied_id.images,
      };
    }

    return {
      ...mess,
      author: {
        _id: mess?.author?._id,
        fullname: `${mess?.author?.first_name} ${mess?.author?.last_name}`,
        avatar: mess?.author?.avatar?.url,
      },
      replied: mess.replied_id,
      replied_id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
    };
  }

  async getMessages({ room_id, _page = 1, _limit = 20, user_id, _offset = 0 }) {
    try {
      _page = parseInt(_page);
      _limit = parseInt(_limit);
      _offset = parseInt(_offset);
      const room = await Room.findOne({ _id: room_id }).lean();

      if (!room) {
        throw new ErrorResponse({ message: "room not found", code: 400 });
      }

      const user = room.members.find(
        (mem) => mem.account_id.toString() === user_id
      );

      if (!user) {
        throw new ErrorResponse({ message: "user not found", code: 400 });
      }

      const total = await Message.countDocuments({ room_id: room_id });
      const skip = (_page - 1) * _limit + _offset;
      const messages = await Message.aggregate([
        {
          $match: {
            room_id: new ObjectId(room_id),
            send_at: {
              $gt: user.delete_messages_at,
            },
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $lookup: {
            from: "messages",
            localField: "replied_id",
            foreignField: "_id",
            as: "replied_id",
            pipeline: [
              {
                $lookup: {
                  from: "accounts",
                  localField: "author",
                  foreignField: "_id",
                  as: "author",
                },
              },
              {
                $unwind: "$author",
              },
              {
                $project: {
                  _id: "$_id",
                  author: {
                    _id: "$author._id",
                    fullname: {
                      $concat: ["$author.first_name", " ", "$author.last_name"],
                    },
                  },
                  content: "$content",
                  images: "$images",
                  send_at: "$send_at",
                },
              },
              {
                $unwind: "$author",
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$replied_id",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            send_at: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: _limit,
        },
        {
          $project: {
            author: {
              _id: "$author._id",
              fullname: {
                $concat: ["$author.first_name", " ", "$author.last_name"],
              },
              avatar: "$author.avatar.url",
            },
            room_id: 1,
            replied: {
              $ifNull: ["$replied_id", null],
            },
            content: 1,
            images: 1,
            send_at: 1,
            isMe: { $eq: ["$author._id", new ObjectId(user_id)] },
          },
        },
      ]);

      return {
        list: messages,
        page: {
          max: Math.ceil(total / _limit),
          current: _page,
          limit: _limit,
          next: messages.length === _limit,
          prev: _page > 1,
        },
      };
    } catch (e) {
      console.log(e);
      e.code = 500;
      throw e;
    }
  }

  async sendMessageNotification(user_ids, room_id, user_id) {
    const room = await Room.findOne({ _id: room_id });
    await room.populate("members.account_id", "first_name last_name");

    if (!room) {
      throw new Error("Not found room");
    }

    const messages = await Message.find({ room_id: room_id })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .populate("author", "first_name last_name");

    if (messages.length <= 0) {
      return;
    }

    let name = "";

    if (room.is_group) {
      name = room.name;
    } else {
      name =
        room.members[0].account_id._id.toString() !== user_ids[0]
          ? `${room.members?.[0]?.account_id?.first_name} ${room.members?.[0]?.account_id?.last_name}`
          : `${room.members?.[1]?.account_id?.first_name} ${room.members?.[1]?.account_id?.last_name}`;
    }

    const user = await Account.findOne({ _id: user_id });

    const message = {
      data: {
        chat: JSON.stringify(
          messages.map((mess) => {
            return {
              author: mess.author.first_name + " " + mess.author.last_name,
              content: mess.content,
              images: mess?.images?.length || 0,
              author_id: mess.author._id.toString(),
            };
          })
        ),
        name,
        main_message: messages[0].content
          ? messages[0].content
          : "Đã gửi " + messages[0].images.length + " ảnh",
        type: "message",
        unique_id: room._id.toString(),
        avatar: user?.avatar?.url,
        info: JSON.stringify({
          is_group: room.is_group,
          participant: !room.is_group
            ? user_ids[0] === room.members?.[0]?.account_id?._id?.toString()
              ? room.members?.[1]?.account_id?._id?.toString()
              : room.members?.[0]?.account_id?._id?.toString()
            : null,
          room_id: room._id.toString(),
        }),
      },
    };

    if (user_ids instanceof Array) {
      await SendNotificationService.sendBroastCastNotification(
        user_ids,
        message
      );
    } else {
      await SendNotificationService.sendNotification(user_ids, message);
    }
  }

  async deleteMessage(user_id, room_id) {
    const room = await Room.findOne({ _id: room_id });

    if (!room) {
      throw new ErrorResponse({ message: "Room not found", code: 400 });
    }

    const user = await Account.findOne({ _id: user_id });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    const member = room.members.find(
      (mem) => mem.account_id.toString() === user_id
    );
    member.delete_messages_at = Date.now();
    await room.save();
  }
}

module.exports = new MessageService();

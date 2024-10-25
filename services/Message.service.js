const Message = require("../models/MessageModel");
const Room = require("../models/RoomModel");
const { ErrorResponse } = require("../core/reponseHandle");
const mongoose = require("mongoose");
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
      await mess.populate("replied_id", "images author content");
      await mess.populate("replied_id.author", "first_name last_name");
    }

    mess = mess.toObject();

    if (mess?.replied_id?.author) {
      mess.replied_id = {
        author: {
          _id: mess.replied_id.author._id,
          fullname: `${mess.replied_id.author.first_name} ${mess.replied_id.author.last_name}`,
        },
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

  async getMessages({ room_id, _page = 1, _limit = 20, user_id }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);
    const room = await Room.findOne({ _id: room_id }).lean();

    if (!room) {
      throw new ErrorResponse({ message: "room not found", code: 400 });
    }

    const total = await Message.countDocuments({ room_id: room_id });
    const skip = (_page - 1) * _limit;
    const messages = await Message.aggregate([
      {
        $match: {
          room_id: new ObjectId(room_id),
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
          ],
        },
      },
      {
        $unwind: "$replied_id",
      },
      {
        $sort: {
          createdAt: -1,
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
            _id: "$replied_id._id",
            author: {
              _id: "$replied_id.author._id",
              fullname: {
                $concat: [
                  "$replied_id.author.first_name",
                  " ",
                  "$replied_id.author.last_name",
                ],
              },
            },
            content: "$replied_id.content",
            images: "$replied_id.images",
            send_at: "$replied_id.send_at",
          },
          content: 1,
          images: 1,
          send_at: 1,
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
  }
}

module.exports = new MessageService();

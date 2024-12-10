const Room = require("../models/RoomModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const User = require("../models/AccountModel");
const { io, usersOnline, sockets } = require("../socket");
const { ErrorResponse } = require("../core/reponseHandle");
const { Message } = require("../models");

class RoomService {
  async createDirectRoom({ members = [], user_id }) {
    console.log("create new room");
    members = members.sort();

    let room = await Room.create({
      members: members.map((mem) => ({
        account_id: mem,
      })),
      host: members[0],
    });

    await room.populate("members.account_id", "first_name last_name avatar");
    room = room.toObject();

    room.members = room.members.map((mem) => {
      return {
        account_id: mem.account_id._id,
        fullname: `${mem.account_id.first_name} ${mem.account_id.last_name}`,
        avatar: mem.account_id?.avatar?.url,
        isMe: mem.account_id._id.toString() === user_id,
      };
    });

    room.name = room.members[0].isMe
      ? room.members[1].fullname
      : room.members[0].fullname;

    return {
      ...room,
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
      host: undefined,
    };
  }

  async getDirectRoom({ members = [], user_id }) {
    const sortedMembers = members.sort();

    let room = await Room.findOne({
      "members.account_id": { $all: sortedMembers },
      is_group: false,
    });

    if (!room)
      return await this.createDirectRoom({ members: sortedMembers, user_id });

    await room.populate("members.account_id", "first_name last_name avatar");

    room = room.toObject();

    room.members = room.members.map((mem) => {
      return {
        account_id: mem.account_id._id,
        fullname: `${mem.account_id.first_name} ${mem.account_id.last_name}`,
        avatar: mem.account_id?.avatar?.url,
        isMe: mem.account_id._id.toString() === user_id,
      };
    });

    room.name = room.members[0].isMe
      ? room.members[1].fullname
      : room.members[0].fullname;

    return {
      ...room,
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
      host: undefined,
    };
  }

  async getGroup({ room_id }) {
    let room = await Room.findOne({ _id: room_id });
    await room.populate("members.account_id", "first_name last_name avatar");
    room = room.toObject();

    room.members = room.members.map((member) => {
      return {
        account_id: member.account_id._id,
        fullname: `${member.account_id.first_name} ${member.account_id.last_name}`,
        avatar: member.account_id?.avatar?.url,
      };
    });

    return {
      ...room,
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
    };
  }

  async createGroup({ host, members = [], name }) {
    const mems = [host, ...members];

    let room = await Room.create({
      is_group: true,
      members: mems.map((mem) => {
        return { account_id: mem };
      }),
      host: host,
      name,
    });

    await room.populate("members.account_id", "avatar");

    room = room.toObject();

    room.members = room.members.map((mem) => {
      return {
        avatar: mem.account_id.avatar.url,
        _id: mem.account_id._id,
      };
    });

    io.to(mems.map((mem) => sockets[mem])).emit("update-room", null, room);

    return room;
  }

  async getRooms({ user_id, _page = 1, _limit = 10 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);

    const total = await Room.countDocuments({
      "members.account_id": { $in: [new ObjectId(user_id)] },
    });

    try {
      const rooms = await Room.aggregate([
        {
          $match: {
            "members.account_id": { $in: [new ObjectId(user_id)] },
          },
        },
        {
          $addFields: {
            snapshot: "$members",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "room_id",
            as: "messages",
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
                $addFields: {
                  "author.fullname": {
                    $concat: ["$author.first_name", " ", "$author.last_name"],
                  },
                },
              },
              {
                $project: {
                  "author.fullname": 1,
                  "author.avatar": "$author.avatar.url",
                  "author._id": 1,
                  "author.isMe": {
                    $eq: ["$author._id", new ObjectId(user_id)],
                  },
                  content: 1,
                  images: 1,
                  send_at: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "members.account_id",
            foreignField: "_id",
            as: "members",
            pipeline: [
              {
                $addFields: {
                  isMe: {
                    $cond: {
                      if: { $eq: ["$_id", new ObjectId(user_id)] },
                      then: true,
                      else: false,
                    },
                  },
                  fullname: { $concat: ["$first_name", " ", "$last_name"] },
                  avatar: "$avatar.url",
                },
              },
            ],
          },
        },
        {
          $match: {
            $or: [
              { messages: { $gte: [{ $size: "$mesages" }, 0] } },
              { is_group: true },
            ],
          },
        },
        {
          $addFields: {
            mess: {
              $sortArray: {
                input: "$messages",
                sortBy: {
                  send_at: -1,
                },
              },
            },
          },
        },
        {
          $addFields: {
            message: {
              $arrayElemAt: ["$mess", 0],
            },
          },
        },
        {
          $sort: {
            "message.send_at": -1,
          },
        },
        {
          $skip: (_page - 1) * _limit,
        },
        {
          $limit: _limit,
        },
        {
          $addFields: {
            relevant_user: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$snapshot",
                    as: "member",
                    cond: {
                      $eq: ["$$member.account_id", new ObjectId(user_id)],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            message: {
              $cond: {
                if: {
                  $gte: [
                    "$message.send_at",
                    "$relevant_user.delete_messages_at",
                  ],
                },
                then: "$message",
                else: null,
              },
            },
          },
        },
        {
          $match: {
            $or: [
              {
                message: { $ne: null },
              },
              {
                is_group: true,
              },
            ],
          },
        },
        {
          $project: {
            is_group: 1,
            name: {
              $cond: {
                if: {
                  $eq: ["$is_group", true],
                },
                then: "$name",
                else: {
                  $cond: {
                    if: {
                      $eq: [{ $arrayElemAt: ["$members.isMe", 0] }, true],
                    },
                    then: {
                      $arrayElemAt: ["$members.fullname", 1],
                    },
                    else: {
                      $arrayElemAt: ["$members.fullname", 0],
                    },
                  },
                },
              },
            },
            "members.avatar": 1,
            "members.fullname": 1,
            "members.isMe": 1,
            "members._id": 1,
            message: 1,
          },
        },
      ]);

      return {
        list: rooms,
        page: {
          max: Math.ceil(total / _limit),
          current: _page,
          next: rooms.length === _limit,
          prev: _page > 1,
          limit: _limit,
        },
      };
    } catch (e) {
      e.code = 500;
      throw e;
    }
  }

  async searchUser({ keyword, user_id, is_group = 0, _page = 1, _limit = 20 }) {
    _page = parseInt(_page);
    _limit = parseInt(_limit);
    is_group = parseInt(is_group);
    let data;
    let total;

    if (is_group === 0) {
      total = await User.countDocuments({
        _id: { $ne: user_id },
        $or: [
          { first_name: { $regex: keyword, $options: "i" } },
          { last_name: { $regex: keyword, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$first_name", " ", "$last_name"] },
                regex: keyword,
                options: "i",
              },
            },
          },
        ],
      });

      const skip = (_page - 1) * _limit;

      data = await User.find({
        _id: { $ne: user_id },
        $or: [
          { first_name: { $regex: keyword, $options: "i" } },
          { last_name: { $regex: keyword, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$first_name", " ", "$last_name"] },
                regex: keyword,
                options: "i",
              },
            },
          },
        ],
      })
        .skip(skip)
        .limit(_limit);

      data = data.map((item) => {
        return {
          _id: item._id,
          fullname: `${item.first_name} ${item.last_name}`,
          avatar: item?.avatar?.url,
          is_group: false,
        };
      });
    } else {
      total = await Room.countDocuments({
        "members.account_id": { $in: user_id },
        name: {
          $regex: keyword,
          $options: "i",
        },
        is_group: true,
      });

      const skip = (_page - 1) * _limit;

      data = await Room.find({
        "members.account_id": { $in: user_id },
        name: {
          $regex: keyword,
          $options: "i",
        },
        is_group: true,
      })
        .skip(skip)
        .limit(_limit)
        .populate("members.account_id", "avatar");
    }
    return {
      list: data,
      page: {
        max: Math.ceil(total / _limit),
        current: _page,
        prev: _page > 1,
        next: data.length === _limit,
        limit: _limit,
      },
    };
  }

  async updateRoomName({ room_id, name, host }) {
    const room = await Room.findOne({ _id: room_id });

    if (!room) {
      throw new ErrorResponse({ message: "room not found", status: 400 });
    }

    if (host !== room.host.toString()) {
      throw new ErrorResponse({ message: "user id not allow", status: 400 });
    }

    room.name = name;
    await room.save();
    room.members.forEach((mem) => {
      io.to(sockets[mem.account_id.toString()]).emit(
        "update-room-name",
        room_id,
        name
      );
    });
  }

  async deleteRoom({ room_id, host }) {
    const room = await Room.findOne({ _id: room_id });

    if (host !== room.host.toString()) {
      throw new ErrorResponse({ message: "user id not allow", status: 400 });
    }

    room.members.forEach((mem) => {
      io.to(sockets[mem.account_id.toString()]).emit(
        "delete-room",
        room_id,
        room.name
      );
    });

    await Room.findByIdAndDelete(room_id);
  }

  async deleteUserInRoom({ user_id, room_id, host }) {
    const room = await Room.findOne({ _id: room_id });

    if (!room) {
      throw new ErrorResponse({ message: "room not found", status: 400 });
    }

    if (host !== room.host.toString()) {
      throw new ErrorResponse({ message: "user id not allow", status: 400 });
    }

    room.members.forEach((mem) => {
      io.to(sockets[mem.account_id.toString()]).emit(
        "remove-member",
        room_id,
        user_id,
        room.name
      );
    });

    room.members = room.members.filter(
      (mem) => mem.account_id.toString() !== user_id
    );

    await room.save();
  }

  async addMembersToRoom({ user_ids, room_id }) {
    const room = await Room.findOne({ _id: room_id });

    if (!room) {
      throw new ErrorResponse({ message: "room not found", code: 400 });
    }

    if (!(user_ids instanceof Array) && user_ids.length < 0) {
      throw new ErrorResponse({ message: "data is empty", code: 400 });
    }

    user_ids = user_ids.map((id) => {
      return {
        account_id: id,
        joined_at: Date.now(),
        delete_messages_at: Date.now(),
      };
    });

    await room.updateOne({
      $push: {
        members: {
          $each: user_ids,
        },
      },
    });

    const messages = await Message.findOne({ room_id: room_id })
      .populate("author", "first_name last_name avatar.url")
      .sort({
        send_at: -1,
      })
      .limit(1);

    const roomUpdated = await Room.findOne({ _id: room_id });

    roomUpdated.members = roomUpdated.members.map((item) => {
      return {
        _id: item.account_id._id,
        avatar: item.account_id?.avatar?.url,
        fullname: `${item.account_id?.first_name} ${item.account_id?.last_name}`,
      };
    });

    delete room.__v;
    delete room.createdAt;
    delete room.updatedAt;

    const message = messages?.[0];

    user_ids.forEach((id) => {
      io.to(sockets[id]).emit("update-room", message, room);
    });
  }
}

module.exports = new RoomService();

const Room = require("../models/RoomModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class RoomService {
  async createDirectRoom({ members = [], user_id }) {
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
      host: undefined,
    };
  }

  async createGroup({ host, members = [], name }) {
    const mems = [host, ...members];

    const room = await Room.create({
      is_group: true,
      members: mems.map((mem) => {
        return { account_id: mem };
      }),
      host: host,
      name,
    });

    return room.toObject();
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
          $skip: (_page - 1) * _limit,
        },
        {
          $limit: _limit,
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
            message: {
              $arrayElemAt: ["$mess", 0],
            },
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
}

module.exports = new RoomService();

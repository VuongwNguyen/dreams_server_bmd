const Room = require("../models/RoomModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class RoomService {
  async createDirectRoom({ members = [] }) {
    const room = await Room.create({
      members: members.map((mem) => ({
        account_id: mem,
      })),
      host: members[0],
    });

    return room.toObject();
  }

  async getDirectRoom({ members = [] }) {
    const sortedMembers = members.sort().map((mem) => new ObjectId(mem));

    const room = await Room.findOne({
      "members.account_id": sortedMembers,
    }).lean();

    if (!room) {
      return await this.createDirectRoom({ members: sortedMembers });
    }

    return room;
  }

  async createGroup({ host, members = [], name }) {
    const mems = [host, ...members];

    const room = await Room.create({
      is_group: true,
      members: mems,
      host: host,
      name,
    });

    return room.toObject();
  }

  async getRooms({ userId }) {
    const rooms = await Room.find({ members: { $in: userId } }).lean();

    return rooms;
  }
}

module.exports = new RoomService();

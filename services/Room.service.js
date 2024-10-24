const Room = require("../models/RoomModel");

class RoomService {
  async createDirectRoom({ members = [] }) {
    const room = await Room.create({
      members: members,
    });

    return room.toObject();
  }

  async getDirectRoom({ members = [] }) {
    const sortedMembers = members.sort();

    const room = await Room.findOne({ members: sortedMembers }).lean();

    if (!room) {
      return await this.createDirectRoom({ userIds: sortedMembers });
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

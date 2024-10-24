const Room = require("../models/RoomModel");

class RoomService {
  async createDirectRoom({ userIds = [] }) {}

  async getDirectRoom({ userIds = [] }) {
    const sortedUserIds = userIds.sort();

    const room = await Room.findOne();
  }
}

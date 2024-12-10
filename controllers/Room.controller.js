const { SuccessfullyReponse } = require("../core/reponseHandle");
const { Room } = require("../models");
const RoomService = require("../services/Room.service");

class RoomController {
  async createGroup(req, res, next) {
    const host = req.user.user_id;
    const { members, name } = req.body;

    new SuccessfullyReponse({
      message: "create group success",
      data: await RoomService.createGroup({ host, members, name }),
    }).json(res);
  }

  async getRoom(req, res, next) {
    const { user_id } = req.user;
    const { participant } = req.body;

    new SuccessfullyReponse({
      message: "get room success",
      data: await RoomService.getDirectRoom({
        members: [user_id, participant],
        user_id,
      }),
    }).json(res);
  }

  async getRooms(req, res, next) {
    const { user_id } = req.user;
    const { _page, _limit } = req.query;

    new SuccessfullyReponse({
      message: "get rooms success",
      data: await RoomService.getRooms({ user_id, _page, _limit }),
    }).json(res);
  }

  async getGroup(req, res, next) {
    const { room_id } = req.body;

    new SuccessfullyReponse({
      message: "get group success",
      data: await RoomService.getGroup({ room_id }),
    }).json(res);
  }

  async searchUser(req, res, next) {
    const { user_id } = req.user;
    const { keyword, _page, _limit, is_group, omit } = req.query;

    new SuccessfullyReponse({
      message: "get list success",
      data: await RoomService.searchUser({
        keyword,
        _page,
        _limit,
        is_group,
        user_id,
        omit,
      }),
    }).json(res);
  }

  async deleteRoom(req, res, next) {
    const { room_id } = req.body;
    const host = req.user.user_id;
    await RoomService.deleteRoom({ room_id, host });

    new SuccessfullyReponse({
      message: "delete room success",
    }).json(res);
  }

  async updateRoomName(req, res, next) {
    const { room_id, name } = req.body;
    const host = req.user.user_id;

    await RoomService.updateRoomName({ room_id, name, host });

    new SuccessfullyReponse({
      message: "update name success",
    }).json(res);
  }

  async deleteMemberInRoom(req, res, next) {
    const { user_id, room_id } = req.body;
    const host = req.user.user_id;

    await RoomService.deleteUserInRoom({ user_id, room_id, host });

    new SuccessfullyReponse({ message: "delete user success" }).json(res);
  }

  async addUsersInRoom(req, res, next) {
    const { user_ids, room_id } = req.body;
    await RoomService.addMembersToRoom({ user_ids, room_id });
    new SuccessfullyReponse({ message: "add users success" }).json(res);
  }
}

module.exports = new RoomController();

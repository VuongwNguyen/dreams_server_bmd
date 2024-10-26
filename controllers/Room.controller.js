const { SuccessfullyReponse } = require("../core/reponseHandle");
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
}

module.exports = new RoomController();

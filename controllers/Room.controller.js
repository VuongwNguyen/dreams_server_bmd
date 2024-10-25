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
}

module.exports = new RoomController();

const { SuccessfullyReponse } = require("../core/reponseHandle");
const MessageService = require("../services/Message.service");

class MessageController {
  async createMessage(req, res, next) {
    const author = req.user.user_id;
    const { message, images, replied_id, room_id } = req.body;

    new SuccessfullyReponse({
      message: "create message success",
      data: await MessageService.createMessage({
        message,
        images,
        replied_id,
        author,
        room_id,
      }),
    }).json(res);
  }

  async deleteMessage(req, res, next) {
    const { room_id } = req.params;
    const user_id = req.user.user_id;

    await MessageService.deleteMessage(user_id, room_id);

    new SuccessfullyReponse({
      message: "delete messages success",
    }).json(res);
  }

  async getMessages(req, res, next) {
    const user_id = req.user.user_id;
    const { _page, _limit, room_id, _offset } = req.query;

    new SuccessfullyReponse({
      message: "get messages success",
      data: await MessageService.getMessages({
        user_id,
        room_id,
        _page,
        _limit,
        _offset,
      }),
    }).json(res);
  }
}

module.exports = new MessageController();

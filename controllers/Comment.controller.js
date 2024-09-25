const { SuccessfullyReponse } = require("../core/reponseHandle");
const CommentService = require("../services/Comment.service");

class CommentController {
  async createComment(req, res, next) {
    const { post_id, content, reply_comment_id = null } = req.body;
    const user_id = req.user.userId;

    new SuccessfullyReponse({
      message: "Comment created successfully",
      code: 200,
      data: await CommentService.createComment({
        post_id,
        user_id,
        reply_comment_id,
        content,
      }),
    }).json(res);
  }

  async getParentCommentByPostId(req, res, next) {
    const { post_id, page = 0, limit = 10, orderBy, order } = req.query;

    new SuccessfullyReponse({
      message: "Get root comments by post id successfully",
      code: 200,
      data: await CommentService.getParentCommentByPostId({
        post_id,
        page,
        limit,
        orderBy,
        order,
      }),
    }).json(res);
  }

  async getCommentsByParentCommentId(req, res, next) {
    const { comment_id, page, limit, orderBy, order } = req.query;

    new SuccessfullyReponse({
      message: "Get comments by parent comment id successfully",
      code: 200,
      data: await CommentService.getCommentsByParentCommentId({
        root_comment_id: comment_id,
        page,
        limit,
        orderBy,
        order,
      }),
    }).json(res);
  }
}

module.exports = new CommentController();

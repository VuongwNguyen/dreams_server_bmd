const { ErrorResponse } = require("../core/reponseHandle");
const Post = require("../models/PostModel");
const Comment = require("../models/CommentModel");
const { default: mongoose } = require("mongoose");
const { removeUndefinedValueInObject } = require("../utils");
const { auth } = require("firebase-admin");

class CommentService {
  async createComment({ post_id, user_id, reply_comment_id, content }) {
    if (!post_id || !content) {
      throw new ErrorResponse({ message: "post_id or content is required" });
    }

    const post = await Post.findOne({ _id: post_id }).lean();

    if (!post) {
      throw new ErrorResponse({ message: "post not found", status: 400 });
    }

    let replyComment = null;

    if (reply_comment_id) {
      replyComment = await Comment.findOne({ _id: reply_comment_id }).lean();

      if (!replyComment) {
        throw new ErrorResponse({
          message: "not found reply comment",
          status: 400,
        });
      }
    }

    const newComment = await Comment.create({
      post_id,
      account_id: user_id,
      reply_comment_id,
      content,
      root_comment_id: replyComment
        ? replyComment.depth <= 1
          ? replyComment._id
          : replyComment.root_comment_id
        : null,
      depth: reply_comment_id
        ? replyComment.depth >= 2
          ? replyComment.depth
          : replyComment.depth + 1
        : 0,
    });

    return newComment;
  }

  async getParentCommentByPostId({
    post_id,
    page = 1,
    limit = 10,
    orderBy,
    order,
  }) {
    if (!post_id) {
      throw new ErrorResponse({
        message: "field post_id is required",
        status: 400,
      });
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          post_id: new mongoose.Types.ObjectId(post_id),
          visible: true,
          depth: 0,
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "root_comment_id",
          as: "reply",
          pipeline: [
            {
              $match: {
                visible: true,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          author: {
            _id: "$author._id",
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
          },
          childCommentCount: { $size: "$reply" },
        },
      },
    ]);

    return comments;
  }

  async getCommentsByParentCommentId({ root_comment_id, page, limit }) {
    if (!root_comment_id) {
      throw new ErrorResponse({
        message: "field comment_id is required",
        status: 400,
      });
    }

    const rootComment = await Comment.findOne({ _id: root_comment_id }).lean();

    if (!rootComment) {
      throw new ErrorResponse({
        message: "Parent comment not found",
        status: 400,
      });
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          visible: true,
          root_comment_id: new mongoose.Types.ObjectId(root_comment_id),
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "account_id",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "comments",
          localField: "reply_comment_id",
          foreignField: "_id",
          as: "reply",
        },
      },
      {
        $unwind: "$reply",
      },
      {
        $lookup: {
          from: "accounts",
          localField: "reply.account_id",
          foreignField: "_id",
          as: "reply.author",
        },
      },
      {
        $unwind: "$reply.author",
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "root_comment_id",
          as: "childrens",
          pipeline: [
            {
              $match: {
                visible: true,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          author: {
            _id: "$author._id",
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
          },
          reply: {
            _id: "$reply._id",
            content: "$reply.content",
            createdAt: "$reply.createdAt",
            author: {
              _id: "$reply.author._id",
              fullname: {
                $concat: [
                  "$reply.author.first_name",
                  " ",
                  "$reply.author.last_name",
                ],
              },
            },
          },
          childCommentCount: { $size: "$childrens" },
        },
      },
    ]);

    return comments;
  }
}

module.exports = new CommentService();

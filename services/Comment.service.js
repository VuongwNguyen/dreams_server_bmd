const { ErrorResponse } = require("../core/reponseHandle");
const Post = require("../models/PostModel");
const Comment = require("../models/CommentModel");
const { default: mongoose } = require("mongoose");
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

  async getParentCommentByPostId({ post_id, page = 1, limit = 10, user_id }) {
    if (!post_id) {
      throw new ErrorResponse({
        message: "field post_id is required",
        status: 400,
      });
    }

    const total = await Comment.countDocuments({ post_id, visible: true });

    const paginationStage = [
      {
        $skip: (+page - 1) * +limit,
      },
      {
        $limit: +limit,
      },
    ];

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
            avatar: {
              url: {
                $ifNull: [
                  "$avatar.url",
                  "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
                ],
              },
              public_id: 1,
            },
          },
          childCommentCount: { $size: "$reply" },
          isLike: {
            $in: [new mongoose.Types.ObjectId(user_id), "$likes"],
          },
          likes: { $size: "$likes" },
        },
      },
      ...paginationStage,
    ]);

    return {
      list: comments,
      page: {
        maxPage: Math.ceil(total / limit),
        currentPage: +page,
        limit: +limit,
        hasNext: comments.length === limit,
        hasPrevious: +page > 1,
      },
    };
  }

  async getCommentsByParentCommentId({
    root_comment_id,
    page = 1,
    limit = 10,
    user_id,
  }) {
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

    const total = await Comment.countDocuments({
      root_comment_id,
      visible: true,
    });

    const paginationStage = [
      {
        $skip: (+page - 1) * +limit,
      },
      {
        $limit: +limit,
      },
    ];

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
      ...paginationStage,
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          visible: 1,
          // hasLike: {
          //   $in: [new mongoose.Types.ObjectId(user_id), "$likes"],
          // },
          author: {
            _id: "$author._id",
            fullname: {
              $concat: ["$author.first_name", " ", "$author.last_name"],
            },
            avatar: {
              url: {
                $ifNull: [
                  "$avatar.url",
                  "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
                ],
              },
              public_id: 1,
            },
          },
          reply: {
            _id: "$reply._id",
            content: "$reply.content",
            createdAt: "$reply.createdAt",
            visible: "$reply.visible",
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
          likes: { $size: "$likes" },
        },
      },
    ]);

    return {
      list: comments,
      page: {
        maxPage: Math.ceil(total / limit),
        currentPage: +page,
        limit: +limit,
        hasNext: comments.length === limit,
        hasPrevious: +page > 1,
      },
    };
  }

  async toggleLikeComment({ comment_id, user_id }) {
    if (!comment_id) {
      throw new ErrorResponse({
        message: "field comment_id is required",
        status: 400,
      });
    }

    const comment = await Comment.findOne({ _id: comment_id });

    if (!comment) {
      throw new ErrorResponse({
        message: "Comment not found",
        status: 400,
      });
    }

    const like = comment.likes.includes(user_id);

    let updatedComment = null;
    let message = null;

    if (!like) {
      updatedComment = await Comment.findOneAndUpdate(
        { _id: comment_id },
        {
          $addToSet: { likes: user_id },
        },
        {
          new: true,
        }
      ).populate("account_id", "first_name last_name");

      message = "Like comment successfully";
    } else {
      updatedComment = await Comment.findOneAndUpdate(
        {
          _id: comment_id,
        },
        {
          $pull: { likes: user_id },
        },
        {
          new: true,
        }
      ).populate("account_id", "first_name last_name");

      message = "Unlike comment successfully";
    }

    return {
      message,
      comment: {
        id: updatedComment._id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt,
        likes: updatedComment.likes?.length || 0,
        author: {
          _id: updatedComment.account_id._id,
          fullname: `${updatedComment.account_id.first_name} ${updatedComment.account_id.last_name}`,
          avatar: {
            url: {
              $ifNull: [
                "$avatar.url",
                "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
              ],
            },
            public_id: 1,
          },
        },
      },
    };
  }

  async updateComment({ comment_id, user_id, content }) {
    if (!comment_id || !content) {
      throw new ErrorResponse({
        message: "field comment_id and content are required",
        status: 400,
      });
    }

    const comment = await Comment.findOne({
      _id: comment_id,
      account_id: user_id,
    });

    if (!comment) {
      throw new ErrorResponse({
        message: "Comment not found",
        status: 400,
      });
    }

    const updatedComment = await Comment.findOneAndUpdate(
      { _id: comment_id },
      {
        $set: { content },
      },
      {
        new: true,
      }
    ).populate("account_id", "first_name last_name");

    return {
      _id: updatedComment._id,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt,
      author: {
        _id: updatedComment.account_id._id,
        fullname: `${updatedComment.account_id.first_name} ${updatedComment.account_id.last_name}`,
        avatar: {
          url: {
            $ifNull: [
              "$avatar.url",
              "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d07bca98931623.5ee79b6a8fa55.jpg",
            ],
          },
          public_id: 1,
        },
      },
      likes: updatedComment.likes.length,
    };
  }

  async deleteComment({ comment_id, user_id }) {
    if (!comment_id) {
      throw new ErrorResponse({
        message: "field comment_id is required",
        status: 400,
      });
    }

    const comment = await Comment.findOne({
      _id: comment_id,
    });

    if (!comment) {
      throw new ErrorResponse({
        message: "Comment not found",
        status: 400,
      });
    }

    await Comment.updateOne(
      {
        _id: comment_id,
        account_id: user_id,
      },
      {
        visible: false,
      }
    );
  }
}

module.exports = new CommentService();

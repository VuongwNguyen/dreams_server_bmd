const { SuccessfullyReponse } = require("../core/reponseHandle");
const PostService = require("../services/Post.service");

class PostController {
  static async createPost(req, res) {
    const { content, parent_id, privacy_status, tagUsers, hashtags } = req.body;
    const user_id = req.user.userId;
    const videos = req.videos;
    const images = req.images;
    const post = await PostService.createPost({
      content,
      parent_id,
      privacy_status,
      user_id,
      tagUsers,
      hashtags,
      videos,
      images,
    });

    return new SuccessfullyReponse({
      data: post,
      message: "Post created successfully",
    }).json(res);
  }
}

module.exports = PostController;

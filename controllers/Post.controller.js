const { SuccessfullyReponse } = require("../core/reponseHandle");
const PostService = require("../services/Post.service");

class PostController {
  async createPost(req, res) {
    const { content, parent_id, privacy_status, tagUsers, hashtags } = req.body;
    const user_id = req.user.user_id;
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

  async getTrendingPosts(req, res) {
    const { _page, _limit } = req.params;
    const user_id = req.user.user_id;
    const post = await PostService.getTrendingPosts({ user_id, _page, _limit });

    return new SuccessfullyReponse({
      data: post,
      message: "Get post successfully",
    }).json(res);
  }

  async setPostViewed(req, res) {
    const { post_id } = req.body;
    const user_id = req.user.user_id;
    await PostService.setPostViewed({ user_id, post_id });

    return new SuccessfullyReponse({
      message: "Post viewed successfully",
    }).json(res);
  }

  async countViewPost(req, res) {
    const { post_id } = req.body;
    await PostService.countViewPost({ post_id });

    return new SuccessfullyReponse({
      message: "Count view post successfully",
    }).json(res);
  }

  async likePost(req, res) {
    const { post_id } = req.body;
    const user_id = req.user.user_id;
    await PostService.likePost({ user_id, post_id });

    return new SuccessfullyReponse({
      message: "Like post successfully",
    }).json(res);
  }
}

module.exports = new PostController();

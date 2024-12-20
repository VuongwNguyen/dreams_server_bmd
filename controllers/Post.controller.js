const { SuccessfullyReponse } = require("../core/reponseHandle");
const PostService = require("../services/Post.service");

class PostController {
  async createPost(req, res) {
    const {
      content,
      children_post_id,
      privacy_status,
      tagUsers,
      hashtags,
      title,
    } = req.body;
    const user_id = req.user.user_id;
    const videos = req.videos;
    const images = req.images;
    const post = await PostService.createPost({
      content,
      children_post_id,
      privacy_status,
      user_id,
      tagUsers,
      hashtags,
      videos,
      images,
      title,
    });

    return new SuccessfullyReponse({
      data: post,
      message: "Post created successfully",
    }).json(res);
  }

  async getTrendingPosts(req, res) {
    const { _page, _limit } = req.query;
    const user_id = req.user.user_id;
    const post = await PostService.getTrendingPosts({ user_id, _page, _limit });

    return new SuccessfullyReponse({
      data: post,
      message: "Get post successfully",
    }).json(res);
  }

  async getFollowingPosts(req, res) {
    const { _page, _limit } = req.query;
    const user_id = req.user.user_id;
    const post = await PostService.getFollowingPosts({
      user_id,
      _page,
      _limit,
    });

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
    const likePost = await PostService.likePost({ user_id, post_id });

    return new SuccessfullyReponse({
      message: likePost.message,
      data: likePost.data,
    }).json(res);
  }

  async getPostByUser(req, res) {
    const { user_id_view, _page, _limit } = req.query;
    const user_id = req.user.user_id;
    const post = await PostService.getPostByUser({
      user_id,
      user_id_view,
      _page,
      _limit,
    });

    return new SuccessfullyReponse({
      data: post,
      message: "Get post successfully",
    }).json(res);
  }

  async getPostDetail(req, res) {
    const { post_id } = req.query;
    const user_id = req.user.user_id;
    const post = await PostService.getPostDetail({ user_id, post_id });

    return new SuccessfullyReponse({
      data: post,
      message: "Get post successfully",
    }).json(res);
  }

  async getPostByHashtag(req, res) {
    const { hashtags, _page, _limit } = req.params;
    const user_id = req.user.user_id;

    const post = await PostService.getPostByHashtag({
      user_id,
      hashtags,
      _page,
      _limit,
    });

    return new SuccessfullyReponse({
      data: post,
      message: "Get post successfully",
    }).json(res);
  }

  async getPostByTitleOrContent(req, res) {
    const { keyword, _page, _limit } = req.params;
    const user_id = req.user.user_id;
    const post = await PostService.getPostByTitleOrContent({
      user_id,
      keyword,
      _page,
      _limit,
    });

    return new SuccessfullyReponse({
      data: post,
      message: "Get post successfully",
    }).json(res);
  }

  async editPost(req, res) {
    const {
      post_id,
      content,
      privacy_status = "",
      tagUsers = [],
      hashtags = [],
      title,
    } = req.body;
    const videos = req.videos;
    const images = req.images;
    const { user_id } = req.user;

    const post = await PostService.editPost({
      user_id,
      post_id,
      content,
      privacy_status,
      tagUsers,
      hashtags,
      videos,
      images,
      title,
    });

    return new SuccessfullyReponse({
      data: post,
      message: "Post edited successfully",
    }).json(res);
  }

  async removePost(req, res) {
    const { post_id } = req.body;
    const { user_id } = req.user;

    await PostService.removePost({ user_id, post_id });

    return new SuccessfullyReponse({
      message: "Post deleted successfully",
    }).json(res);
  }
}

module.exports = new PostController();

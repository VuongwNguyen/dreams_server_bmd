const express = require("express");
const router = express.Router();
const uploader = require("../config/uploader");
const Upload = require("../middlewares/upload.middleware");
const asyncHandler = require("../core/asyncHandler");
const { verifyUser } = require("../middlewares/verifyUser");
const PostController = require("../controllers/Post.controller");

router.use(verifyUser);
router.post(
  "/create-post",
  uploader.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 4 },
  ]),
  asyncHandler(Upload.handleUploadResources),
  asyncHandler(PostController.createPost),
  Upload.deleteResources
);
router.get("/trending-posts", asyncHandler(PostController.getTrendingPosts));
router.get("/following-posts", asyncHandler(PostController.getFollowingPosts));
router.post("/set-post-viewed", asyncHandler(PostController.setPostViewed));
router.post("/count-view-post", asyncHandler(PostController.countViewPost));
router.post("/like-post", asyncHandler(PostController.likePost));
router.get("/get-post-detail/:post_id", asyncHandler(PostController.getPost));
router.get("/get-post-by-user", asyncHandler(PostController.getPostByUser));
router.get("/get-post-detail", asyncHandler(PostController.getPostDetail));
router.get(
  "/get-post-by-hashtag/:hashtag",
  asyncHandler(PostController.getPostByHashtag)
);
router.put(
  "/edit-post",
  uploader.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 4 },
  ]),
  asyncHandler(Upload.handleUploadResources),
  asyncHandler(PostController.editPost),
  Upload.deleteResources
);
router.delete("/remove-post", asyncHandler(PostController.removePost));
module.exports = router;

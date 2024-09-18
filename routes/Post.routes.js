const express = require("express");
const router = express.Router();
const uploader = require("../config/uploader");
const Upload = require("../middlewares/upload.middleware");
const asyncHandler = require("../core/asyncHandler");
const verifyUser = require("../middlewares/verifyUser");
const PostController = require("../controllers/Post.controller");

router.post(
  "/create-post",
  verifyUser,
  uploader.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 4 },
  ]),
  asyncHandler(Upload.handleUploadResources),
  asyncHandler(PostController.createPost),
  Upload.deleteResources
);

router.get("/trending-posts/:_page/:_limit", verifyUser, asyncHandler(PostController.getTrendingPosts));
router.post("/set-post-viewed", verifyUser, asyncHandler(PostController.setPostViewed));
router.post("/count-view-post", verifyUser, asyncHandler(PostController.countViewPost));

module.exports = router;

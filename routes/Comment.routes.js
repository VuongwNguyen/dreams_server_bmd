const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");
const CommentController = require("../controllers/Comment.controller");
const router = express.Router();

router.post("/", verifyUser, asyncHandler(CommentController.createComment));
router.get("/", asyncHandler(CommentController.getParentCommentByPostId));
router.get(
  "/child-comments",
  asyncHandler(CommentController.getCommentsByParentCommentId)
);

module.exports = router;

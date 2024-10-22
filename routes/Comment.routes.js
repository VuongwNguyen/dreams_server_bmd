const express = require("express");
const { verifyUser } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");
const CommentController = require("../controllers/Comment.controller");
const router = express.Router();

router.use(verifyUser);
router.post("/", asyncHandler(CommentController.createComment));
router.put("/", asyncHandler(CommentController.updateComment));
router.post("/like", asyncHandler(CommentController.toggleLikeComment));
router.delete("/:comment_id", asyncHandler(CommentController.deleteComment));
router.get("/", asyncHandler(CommentController.getParentCommentByPostId));
router.get(
  "/child-comments",
  asyncHandler(CommentController.getCommentsByParentCommentId)
);

module.exports = router;

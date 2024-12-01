const express = require("express");
const { verifyUser } = require("../middlewares/verifyUser");
const MessageController = require("../controllers/Message.controller");
const asyncHandler = require("../core/asyncHandler");
const router = express.Router();
const uploader = require("../config/uploader");
const {
  handleUploadResources,
  deleteResources,
} = require("../middlewares/upload.middleware");

router.use(verifyUser);
router.get("/", asyncHandler(MessageController.getMessages));
router.post("/", asyncHandler(MessageController.createMessage));
router.delete("/:room_id", asyncHandler(MessageController.deleteMessage));
router.post(
  "/upload-images",
  uploader.fields([{ name: "images" }]),
  asyncHandler(handleUploadResources),
  (req, res) => {
    return res.json({
      data: req.images,
      message: "Upload images success",
    });
  },
  asyncHandler(deleteResources)
);

module.exports = router;

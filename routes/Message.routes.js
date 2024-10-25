const express = require("express");
const { verifyUser } = require("../middlewares/verifyUser");
const MessageController = require("../controllers/Message.controller");
const asyncHandler = require("../core/asyncHandler");
const router = express.Router();

router.use(verifyUser);
router.get("/", asyncHandler(MessageController.getMessages));
router.post("/", asyncHandler(MessageController.createMessage));

module.exports = router;

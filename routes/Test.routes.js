const express = require("express");
const asyncHandler = require("../core/asyncHandler");
const TestController = require("../controllers/Test.controller");
const { verifyUser } = require("../middlewares/verifyUser");
const router = express.Router();

router.post("/send-noti", verifyUser, asyncHandler(TestController.sendNoti));

module.exports = router;

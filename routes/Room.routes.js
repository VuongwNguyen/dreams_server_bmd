const express = require("express");
const RoomController = require("../controllers/Room.controller");
const { verifyUser } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");
const router = express.Router();

router.use(verifyUser);
router.post("/", asyncHandler(RoomController.createGroup));
router.post("/get-room", asyncHandler(RoomController.getRoom));
router.get("/", asyncHandler(RoomController.getRooms));

module.exports = router;

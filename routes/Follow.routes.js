const FollowController = require("../controllers/Follow.controller");
const router = require("express").Router();
const verifyUser = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.post("/follow", verifyUser, asyncHandler(FollowController.follow));
router.post("/unfollow", verifyUser, asyncHandler(FollowController.unfollow));
router.get("/followers", verifyUser, asyncHandler(FollowController.getFollowers));
router.get("/following", verifyUser, asyncHandler(FollowController.getFollowing));

module.exports = router;

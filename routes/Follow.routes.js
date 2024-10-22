const FollowController = require("../controllers/Follow.controller");
const asyncHandler = require("../core/asyncHandler");
const { verifyUser } = require("../middlewares/verifyUser");
const router = require("express").Router();

router.use(verifyUser);
router.post("/toggle-follow", asyncHandler(FollowController.toggleFollowUser));
router.get("/get-followings", asyncHandler(FollowController.getFollowings));
router.get("/get-followers", asyncHandler(FollowController.getFollowers));

module.exports = router;

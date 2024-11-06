const { verifyUser } = require("../middlewares/verifyUser");

const router = require("express").Router();
router.get("/", verifyUser, async (req, res) => {
  res.json({
    status: true,
    message: "Welcome to the API of Dreams Social Network",
    data: null,
  });
});

router.use("/account", require("./Account.routes"));
router.use("/post", require("./Post.routes"));
router.use("/comment", require("./Comment.routes"));
router.use("/follow", require("./Follow.routes"));
router.use("/infomation", require("./Infomation.routes"));
// router.use("/report-reason", require("./ReportReason.routes"));
router.use("/notify", require("./Notification.routes"));
router.use("/room", require("./Room.routes"));
router.use("/message", require("./Message.routes"));
router.use("/test", require("./Test.routes"));
router.use("/search", require("./Search.route"));

module.exports = router;

const router = require("express").Router();
const { verifyUser } = require("../middlewares/verifyUser");

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
router.use("/report", require("./Report.routes"));
router.use("/notify", require("./Notification.routes"));

module.exports = router;

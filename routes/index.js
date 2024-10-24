const router = require("express").Router();

router.get("/", async (req, res) => {
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
router.use("/report-reason", require("./ReportReason.routes"));

module.exports = router;

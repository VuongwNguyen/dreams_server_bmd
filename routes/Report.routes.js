const reportController = require("../controllers/Report.controller");
const router = require("express").Router();
const { verifyAdmin, verifyUser } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.use(verifyUser);
router.post("/report", asyncHandler(reportController.createReport));
router.get("/reports", verifyAdmin, asyncHandler(reportController.getReports)); // admin
router.put(
  "/report",
  verifyAdmin,
  asyncHandler(reportController.judgeTheReport)
); // admin

module.exports = router;

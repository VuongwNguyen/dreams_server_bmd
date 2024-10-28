const {
  reportController,
  reasonController,
} = require("../controllers/ReportReason.controller");
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

router.post(
  "/reason",
  verifyAdmin,
  asyncHandler(reasonController.upSertReason)
); // admin
router.get("/reasons", asyncHandler(reasonController.getReasons)); // admin
router.delete(
  "/reason",
  verifyAdmin,
  asyncHandler(reasonController.deleteReason)
); // admin

module.exports = router;

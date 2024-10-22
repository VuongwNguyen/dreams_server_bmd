const {
  reportController,
  reasonController,
} = require("../controllers/ReportReason.controller");
const router = require("express").Router();
const { verifyAdmin, verifyUser } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.use(verifyUser);
router.post(
  "/report",
  verifyAdmin,
  asyncHandler(reportController.createReport)
); // admin
router.get("/reports", asyncHandler(reportController.getReports));
router.put(
  "/report",
  verifyUser,
  verifyAdmin,
  asyncHandler(reportController.updateReportStatus)
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

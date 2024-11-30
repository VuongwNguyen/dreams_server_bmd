const router = require("express").Router();
const { verifyUser } = require("../middlewares/verifyUser");
const NotificationController = require("../controllers/Notification.controller");
const asyncHandler = require("../core/asyncHandler");

router.use(verifyUser);
router.get(
  "/notifications",
  asyncHandler(NotificationController.getNotifications)
);

router.put(
  "/notification/:notification_id",
  asyncHandler(NotificationController.detailNotification)
);

router.get(
  "/notification/status",
  asyncHandler(NotificationController.getStatusNotification)
);

router.put(
  "/notification/toggle",
  asyncHandler(NotificationController.toggleNotification)
);

module.exports = router;

const InfomationController = require("../controllers/Infomation.controller");
const router = require("express").Router();
const verifyUser = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.post(
  "/up-sert-infomation",
  verifyUser,
  asyncHandler(InfomationController.upSertInfomation)
);

// router.get(
//   "/get-infomation",
//   verifyUser,
//   asyncHandler(InfomationController.getInfomation)
// );
router.get(
  "/me",
  verifyUser,
  asyncHandler(InfomationController.getMe)
)

router.get(
  "/:id",
  verifyUser,
  asyncHandler(InfomationController.getInfomation)
);



module.exports = router;

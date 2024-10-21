const InfomationController = require("../controllers/Infomation.controller");
const router = require("express").Router();
const verifyUser = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.post(
  "/up-sert-infomation",
  verifyUser,
  asyncHandler(InfomationController.upSertInfomation)
);

router.get(
  "/get-infomation",
  verifyUser,
  asyncHandler(InfomationController.getInfomation)
);

router.get(
  "/get-infomation-list",
  verifyUser,
  asyncHandler(InfomationController.getInfomationList)
);

router.get(
  "/get-infomation-by-self-setting",
  verifyUser,
  asyncHandler(InfomationController.getInfomationBySelfSetting)
);

module.exports = router;

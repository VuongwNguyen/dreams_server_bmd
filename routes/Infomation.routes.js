const InfomationController = require("../controllers/Infomation.controller");
const router = require("express").Router();
const { verifyUser } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.use(verifyUser);
router.post(
  "/up-sert-infomation",
  asyncHandler(InfomationController.upSertInfomation)
);

router.get("/get-infomation", asyncHandler(InfomationController.getInfomation));

router.get(
  "/get-infomation-list",
  asyncHandler(InfomationController.getInfomationList)
);

router.get(
  "/get-infomation-by-self-setting",
  asyncHandler(InfomationController.getInfomationBySelfSetting)
);

module.exports = router;

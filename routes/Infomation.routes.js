const InfomationController = require("../controllers/Infomation.controller");
const Upload = require("../middlewares/upload.middleware");
const uploader = require("../config/uploader");

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

router.post(
  "/change-avatar-name",
  uploader.single("avatar"),
  asyncHandler(Upload.changeAvatar),
  asyncHandler(InfomationController.changeNameAvatar),
  asyncHandler(Upload.deleteResources)
);

module.exports = router;

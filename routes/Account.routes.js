const AccountController = require("../controllers/Account.controller");
const asyncHandler = require("../core/asyncHandler");
const { verifyUser } = require("../middlewares/verifyUser");
const router = require("express").Router();

router.post("/register", asyncHandler(AccountController.register));
router.post("/login", asyncHandler(AccountController.login));
router.post("/verify-email", asyncHandler(AccountController.verifyEmail));
router.post(
  "/send-verify-code",
  asyncHandler(AccountController.sendVerifyCode)
);
router.post(
  "/change-password",
  verifyUser,
  asyncHandler(AccountController.changePassword)
);
router.post(
  "/verify-code-reset-password",
  asyncHandler(AccountController.verifyCodeResetPassword)
);
router.post("/reset-password", asyncHandler(AccountController.resetPassword));
router.post("/renew-tokens", asyncHandler(AccountController.renewTokens));
router.post("/logout", verifyUser, asyncHandler(AccountController.logout));
router.get("/get-info", verifyUser, asyncHandler(AccountController.getInfo));
router.post(
  "/get-stream-token",
  verifyUser,
  asyncHandler(AccountController.getStreamToken)
);
router.post(
  "/update-fcm",
  verifyUser,
  asyncHandler(AccountController.updateFcm)
);
router.post("/revoke-fcm", asyncHandler(AccountController.revokeFcmToken));
router.post(
  "/auth-third-partner",
  asyncHandler(AccountController.authThirdPartner)
);
router.post(
  "/auth-github",
  asyncHandler(AccountController.authGithub)
);


module.exports = router;

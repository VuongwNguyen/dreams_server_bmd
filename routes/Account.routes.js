const AccountController = require("../controllers/Account.controller");
const asyncHandler = require("../core/asyncHandler");
const verifyUser = require("../middlewares/verifyUser");
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
router.post("/get-name-avatar-user", verifyUser, asyncHandler(AccountController.getNameAvatarUser));

module.exports = router;

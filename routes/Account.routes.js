const AccountController = require("../controllers/Account.controller");
const asyncHandler = require("../core/asyncHandler");
const verifyUser = require("../middlewares/verifyUser");
const router = require("express").Router();

router.post("/register", asyncHandler(AccountController.register));
router.post("/login", asyncHandler(AccountController.login));
router.post("/verify-email", asyncHandler(AccountController.verifyEmail));
router.post(
  "/send-verify-email",
  asyncHandler(AccountController.sendVerifyEmail)
);
router.post(
  "/change-password",
  verifyUser,
  asyncHandler(AccountController.changePassword)
);
router.post(
  "/send-code-reset-password",
  asyncHandler(AccountController.sendCodeResetPassword)
);
router.post(
  "/verify-code-reset-password",
  asyncHandler(AccountController.verifyCodeResetPassword)
);
router.post("/reset-password", asyncHandler(AccountController.resetPassword));

module.exports = router;

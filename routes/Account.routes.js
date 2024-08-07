const AccountController = require("../controllers/Account.controller");
const asyncHandler = require("../core/asyncHandler");
const router = require("express").Router();


router.post("/register", asyncHandler(AccountController.register));
router.post("/login", asyncHandler(AccountController.login));
router.post("/verify-email", asyncHandler(AccountController.verifyEmail));
router.post("/send-verify-email", asyncHandler(AccountController.sendVerifyEmail));


module.exports = router;

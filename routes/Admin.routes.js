const router = require("express").Router();

const {
  verifyUser,
  verifyAdmin,
  verifySuperAdmin,
} = require("../middlewares/verifyUser");

const asyncHandler = require("../core/asyncHandler");
const AdminController = require("../controllers/Admin.controller");

router.post("/login-admin", asyncHandler(AdminController.loginAdmin));

module.exports = router;

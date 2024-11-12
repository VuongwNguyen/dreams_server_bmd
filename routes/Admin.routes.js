const router = require("express").Router();

const { verifyUser, verifySuperAdmin } = require("../middlewares/verifyUser");

const asyncHandler = require("../core/asyncHandler");
const AdminController = require("../controllers/Admin.controller");

router.post("/login-admin", asyncHandler(AdminController.loginAdmin));
router.post(
  "/register-admin",
  verifyUser,
  verifySuperAdmin,
  asyncHandler(AdminController.registerAdmin)
);
router.get(
  "/admins",
  verifyUser,
  verifySuperAdmin,
  asyncHandler(AdminController.getAdmins)
);

router.delete(
  "/revoke-admin",
  verifyUser,
  verifySuperAdmin,
  asyncHandler(AdminController.revokeAdmin)
);

module.exports = router;

const router = require("express").Router();

const PolicyController = require("../controllers/Policy.controller");
const { verifyUser, verifyAdmin } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");

router.use(verifyUser);
router.post(
  "/upsert-policy", 
  verifyAdmin,
  asyncHandler(PolicyController.upSertPolicy)
);
router.get("/policy", asyncHandler(PolicyController.getAllPolicies));
router.delete("/policy", verifyAdmin, asyncHandler(PolicyController.deletePolicy));

module.exports = router;

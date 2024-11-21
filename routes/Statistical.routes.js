const StatisticalController = require("../controllers/Statistical.controller");
const asyncHandler = require("../core/asyncHandler");
const express = require("express");
const router = express.Router();
const { verifyUser, verifyAdmin } = require("../middlewares/verifyUser");

router.use(verifyUser);
router.use(verifyAdmin);

router.get("/info", asyncHandler(StatisticalController.getInfos));
router.get("/celebrity", asyncHandler(StatisticalController.getCelebrities));
router.get("/posts", asyncHandler(StatisticalController.getPostsByUser));

module.exports = router;

const StatisticalController = require("../controllers/Statistical.controller");
const asyncHandler = require("../core/asyncHandler");
const express = require("express");
const router = express.Router();

router.get("/info", asyncHandler(StatisticalController.getInfos));
router.get("/celebrity", asyncHandler(StatisticalController.getCelebrities));

module.exports = router;

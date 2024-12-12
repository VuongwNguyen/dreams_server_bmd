const express = require("express");
const { verifyUser } = require("../middlewares/verifyUser");
const asyncHandler = require("../core/asyncHandler");
const SearchControllers = require("../controllers/Search.controllers");
const router = express.Router();

router.use(verifyUser);
router.get("/", asyncHandler(SearchControllers.searchUser));
router.get("/search-post", asyncHandler(SearchControllers.searchPost));
router.get("/search-hashtag", asyncHandler(SearchControllers.searchHashtag));

module.exports = router;

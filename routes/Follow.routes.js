const FollowController = require('../controllers/Follow.controller');
const asyncHandler = require('../core/asyncHandler');
const verifyUser = require('../middlewares/verifyUser');
const router = require('express').Router();


router.post('/toggle-follow', verifyUser, asyncHandler(FollowController.toggleFollowUser));
router.get('/get-followings', verifyUser, asyncHandler(FollowController.getFollowings));
router.get('/get-followers', verifyUser, asyncHandler(FollowController.getFollowers));


module.exports = router;
const router = require('express').Router();


router.get('/', async (req, res) => {
    res.json({
        status: true,
        message: "Welcome to the API",
        data: null
    });
});

module.exports = router;
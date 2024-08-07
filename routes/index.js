const router = require('express').Router();


router.get('/', async (req, res) => {
    res.json({
        status: true,
        message: "Welcome to the API of Dreams Social Network",
        data: null
    });
});


router.use('/account', require('./Account.routes'));

module.exports = router;
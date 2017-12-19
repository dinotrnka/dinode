const express = require('express');

const router = express();

router.use('/users', require('./users'));
router.use('/notes', require('./notes'));

module.exports = router;

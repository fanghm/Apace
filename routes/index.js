var express = require('express');
var router = express.Router();
var action = require('../controllers/action');

router.get('/', action.index);

module.exports = router;
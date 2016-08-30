var express = require('express');
var router = express.Router();
var action = require('../controllers/action');

router.get('/', action.index);
router.post('/add', action.add);
module.exports = router;
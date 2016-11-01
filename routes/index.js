var express = require('express');
var action = require('../controllers/action');
var sign = require('../controllers/sign');

var router = express.Router();

router.get('/', action.index);
router.post('/add', action.add);
router.put('/update/:id', action.update);
router.delete('/delete/:id', action.delete);

router.post('/upload', action.upload);
router.post('/unload', action.unload);

router.post('/login', sign.login);

router.get('*', action.route);

module.exports = router;
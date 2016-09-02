var express = require('express');
var router = express.Router();
var action = require('../controllers/action');

router.get('/', action.index);
router.post('/add', action.add);
router.put('/update/:id', action.update);
router.delete('/delete/:id', action.delete);
module.exports = router;
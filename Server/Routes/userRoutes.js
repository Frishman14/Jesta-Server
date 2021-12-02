const express = require('express');
const userController =  require('../Controllers/userController');
var router = express.Router();

router.route('/').get(userController.getAllUsers);
router.route('/').post(userController.create);

module.exports = router
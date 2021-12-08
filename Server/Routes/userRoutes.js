const express = require('express');
const userController =  require('../Controllers/userController');
var router = express.Router();

router.route('/').get(userController.getAllUsers); // route to get all users
router.route('/').post(userController.create); // route to create a new user
router.route('/delete_user').post(userController.deleteOne); // route to delete one user
router.route('/update_user').patch(userController.updateOne); // route to update one user

module.exports = router
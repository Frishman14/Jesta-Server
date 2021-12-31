const express = require('express');
const userController =  require('../Controllers/userController');
var router = express.Router();

/**
 * @swagger
 * /users:
 *  get:
 *      description: Use to get all the users
 *      responses: 
 *          '200':
 *              description: Users retrieved successfully
 *              schema:
 *                  type: object
 *                  status:
 *                      type: string
 *                  data:
    *                  $ref: '#/definitions/User'
 *          '500':
 *              description: Internal server error
 */
router.route('/').get(userController.getAllUsers); // route to get all users
/**
 * @swagger
 * /users:
 *  post:
 *      description: Use to create a new user
 *      produces:
 *          - application/json
 *      responses: 
 *          '200':
 *              description: User has been created
 *          '400':
 *              description: Validation error
 *          '500':
 *              description: Internal server error
 */
router.route('/').post(userController.create); // route to create a new user
/**
 * @swagger
 * /users/delete_user:
 *  post:
 *      description: Use to delete user
 *      produces:
 *          - application/json
 *      responses: 
 *          '200':
 *              description: User has been deleted
 *          '406':
 *              description: Didn't passed a uniqe value - error
 *          '500':
 *              description: Internal server error
 */
router.route('/delete_user').post(userController.deleteOne); // route to delete one user
/**
 * @swagger
 * /users/update_user:
 *  post:
 *      description: Use to update user details
 *      produces:
 *          - application/json
 *      responses: 
 *          '200':
 *              description: User has been updated
 *          '406':
 *              description: Didn't passed a uniqe value - error
 *          '500':
 *              description: Internal server error
 */
router.route('/update_user').patch(userController.updateOne); // route to update one user

module.exports = router
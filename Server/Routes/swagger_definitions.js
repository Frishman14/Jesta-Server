/**
 * @swagger
 * definitions:
 *  Address:
 *      properties:
 *          country:
 *              type: string
 *          city:
 *              type: string
 *          street:
 *              type: string
 */

/**
 * @swagger
 * definitions:
 *  User:
 *      required:
 *          - firstname
 *          - lastname 
 *          - email
 *          - password
 *          - birthday
 *          - address
 *      properties:
 *          firstname:
 *              type: string
 *          lastname:
 *              type: string
 *          email:
 *              type: string
 *              format: email
 *          password:
 *              type: string
 *              writeOnly: string
 *              format: password
 *          address:
 *              $ref: '#/definitions/Address'
 *          created_date:
 *              type: string
 *              format: date
 *          imagePath:
 *              type: string
 *          role:
 *              type: string
 *          phone:
 *              type: string
 *          phone_country_code:
 *              type: string
 */
const jwt = require('jsonwebtoken');
const {secret} = require('../config.json');
const {ROLES} = require('../Models/Common/consts');

const decodeToken = (req) => {
    const header = req.headers.authorization;
    if (header) {
        const token = header.replace('Bearer ', '');
        return jwt.verify(token, secret, function (err, decoded) {
            return decoded;
        });
    }
    return null;
}

const isAuthenticated = (user, roleLevel = ROLES.CLIENT) => {
    return user.role === roleLevel || user.role === ROLES.ADMIN;
}

module.exports = {decodeToken, isAuthenticated}
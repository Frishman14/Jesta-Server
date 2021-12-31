const consts = require("./consts");

const validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

const validatePassword = function(password) {
    if (password.length < 8 || password.toLowerCase() == password || password.toUpperCase() == password)
        return false;
    return true;
}

const validateBirthday = function(birthday) {
    let today = new Date();
    today.setFullYear(today.getFullYear() - 5);
    if ( birthday > today)
        return false;
    return true;
}

const validateRole = function(role) {
    for (let r in consts.ROLES){
        if (role == consts.ROLES[r])
            return true;
    }
    return false;
}

exports.validateRole = validateRole
exports.validateBirthday = validateBirthday
exports.validatePassword = validatePassword
exports.validateEmail = validateEmail
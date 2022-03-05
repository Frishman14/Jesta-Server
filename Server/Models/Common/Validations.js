const consts = require("./consts");

const validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

const validatePassword = function(password) {
    return !(password.length < 8 || password.toLowerCase() === password || password.toUpperCase() === password);

}

const validateBirthday = function(birthday) {
    let today = new Date();
    today.setFullYear(today.getFullYear() - 5);
    return birthday <= today;

}

const validateRole = function(role) {
    for (let r in consts.ROLES){
        if (role === consts.ROLES[r])
            return true;
    }
    return false;
}

const validateResult = function(result) {
    for (let r in consts.RESULT){
        if (result === consts.RESULT[r])
            return true;
    }
    return false;
}

const validateReportsStatuses = function(status) {
    for (let r in consts.REPORT_STATUS){
        if (status === consts.REPORT_STATUS[r])
            return true;
    }
    return false;
}

exports.validateRole = validateRole
exports.validateResult = validateResult
exports.validateReportsStatuses = validateReportsStatuses
exports.validateBirthday = validateBirthday
exports.validatePassword = validatePassword
exports.validateEmail = validateEmail
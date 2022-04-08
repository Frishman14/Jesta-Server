const { ErrorId } = require("../utilities/error-id");

exports.errorDuplicateKeyHandler = (error) => {
    if(error.code === 11000){
        return ErrorId.Exists;
    }
    return error;
}
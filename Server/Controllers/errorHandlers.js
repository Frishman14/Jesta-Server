exports.errorDuplicateKeyHandler = (error) => {
    if(error.code === 11000){
        return JSON.stringify(error.keyValue) + " already exist";
    }
    return error;
}
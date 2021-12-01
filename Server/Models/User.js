var mongoose = require('mongoose');
const validation = require("./Common/Validations");
const consts = require("./Common/consts");

var userSchema = module.exports =  mongoose.Schema({
    firstName: {
        type: String,
        required: "must enter a first name"
    },
    lastName: {
        type: String,
        required: "must enter a last name"
    },
    email: {
        unique: true,
        trim: true,
        type: String,
        required: "must enter a last name",
        validate: [validation.validateEmail, "The email is not valid"]
    },
    DateEmailVerified: {
        type: Date,
        default: Date.now()
    },
    HashedPassword: {
        type: String, //TODO: in future add hash
        required: "must enter a password",
        validate: [validation.validatePassword, "password is invalid"]
    },
    DatePasswordModified: {
        type: Date
    },
    Birthday: {
        type: Date,
        required: "must have a birthday",
        validate: [validation.validateBirthday, "You can not be under the age of 5"]
    },
    Phone: {
        type: String
    },
    PhoneCountryCode: {
        type: String
    },
    Address: {
        Country: {
            type: String,
            required: "must enter a country"
        },
        City: {
            type: String,
            required: "must enter a City"
        },
        Street: {
            type: String,
            required: "must enter a Street"
        }
    },
    Role: {
        type: String,
        default: consts.ROLES.CLIENT,
        validate: [validation.validateRole, "invalid role"]
    },
    ImagePath: {
        type: String,
        //TODO: add in future
    },
    created_date:{
        type: Date,
        default: Date.now()
    }
});

var User = module.exports = mongoose.model('user', userSchema);
module.exports.get = function(callback, limit){
    User.find(callback).limit(limit);
}
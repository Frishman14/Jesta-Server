var mongoose = require('mongoose');
const validation = require("./Common/Validations");
const consts = require("./Common/consts");

var userSchema = module.exports = mongoose.Schema({
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
    dateEmailVerified: {
        type: Date,
    },
    hashedPassword: {
        type: String, //TODO: in future add hash
        required: "must enter a password",
        validate: [validation.validatePassword, "password is invalid"]
    },
    datePasswordModified: {
        type: Date
    },
    birthday: {
        type: Date,
        required: "must have a birthday",
        validate: [validation.validateBirthday, "You can not be under the age of 5"]
    },
    phone: {
        type: String
    },
    phoneCountryCode: {
        type: String
    },
    address: {
        country: {
            type: String,
            required: "must enter a country"
        },
        city: {
            type: String,
            required: "must enter a City"
        },
        street: {
            type: String,
            required: "must enter a Street"
        }
    },
    role: {
        type: String,
        default: consts.ROLES.CLIENT,
        validate: [validation.validateRole, "invalid role"]
    },
    imagePath: {
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

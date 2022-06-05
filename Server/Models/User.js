const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10
const validation = require("./Common/Validations");
const constants = require("./Common/consts");
const { addressSchema } = require("./Common/Address");

let userSchema = module.exports = mongoose.Schema({
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
        type: String,
        required: "must enter a password",
        select: false,
        validate: [validation.validatePassword, "password is invalid"]
    },
    datePasswordModified: {
        type: Date
    },
    birthday: {
        type: Date,
        validate: [validation.validateBirthday, "You can not be under the age of 5"]
    },
    phone: {
        type: String
    },
    phoneCountryCode: {
        type: String
    },
    address: {
        type: addressSchema,
    },
    role: {
        type: String,
        default: constants.ROLES.CLIENT,
        validate: [validation.validateRole, "invalid role"]
    },
    imagePath: {
        type: String,
    },
    created_date:{
        type: Date,
        default: Date.now()
    },
    mostVolunteered: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 5
    },
    numberOfRates: {
        type: Number,
        default: 1
    },
    numberOfExecutedJestaForMedal: {
        type: Number,
        default: 0
    },
    numberOfExecutedJesta: {
        type: Number,
        default: 0
    },
    notificationToken: {
        type: String
    },
    description: {
        type: String
    },
    medal: {
        type: Number,
        default: 0
    }
});

// hash password
userSchema.pre('save', function(next){ 
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('hashedPassword')) return next();
    
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
    
        // hash the password along with our new salt
        bcrypt.hash(user.hashedPassword, salt, function(err, hash) {
            if (err) return next(err);
    
            // override the cleartext password with the hashed one
            user.hashedPassword = hash;
            next();
        });
    });
});

userSchema.pre("updateOne", function(next){
    let query = this;
    let update = query.getUpdate();
    if (!update.hashedPassword) return next();
    if (!validation.validatePassword(update['$set'].password)){
        return new Error("invalid")
    }
     // generate a salt
     bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
    
        // hash the password along with our new salt
        bcrypt.hash(update.hashedPassword, salt, function(err, hash) {
            if (err) return next(err);
    
            // override the cleartext password with the hashed one
            update.hashedPassword = hash;
            update.datePasswordModified = Date.now()
            next();
        });
    });
})

userSchema.pre("findOneAndUpdate", function(next){
    let query = this;
    let update = query.getUpdate();
    if (!update['$set'].password) return next();
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
        if (!validation.validatePassword(update['$set'].password)){
            return next(new Error("invalid"));
        }
        // hash the password along with our new salt
        bcrypt.hash(update['$set'].password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            update.hashedPassword = hash;
            update.datePasswordModified = Date.now()
            next();
        });
    });
})

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.hashedPassword, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

var User = module.exports = mongoose.model('user', userSchema);

module.exports.get = function(callback, limit){
    User.find(callback).limit(limit);
}
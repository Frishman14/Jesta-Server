const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config.json');
const { errorDuplicateKeyHandler } = require('./errorHandlers');
User = require("../Models/User");

exports.createOne = async (inputUser) => {
    let userToCreate = inputUser.userParams;
    let address = {country: userToCreate.country, city: userToCreate.city, street: userToCreate.street}
    delete userToCreate.country;
    delete userToCreate.city;
    delete userToCreate.street;
    userToCreate.address = address;
    let user = new User(userToCreate);
    return await user.save().then(savedUser => {
        console.log("success added a new user: " + savedUser) //TODO change to debug message in watson
        userToCreate.password = userToCreate.hashedPassword;
        return this.connect(userToCreate);
    }).catch(error => {
        //TODO change to watson
        console.log("failed to add user " + error.message)
        let handledError = errorDuplicateKeyHandler(error)
        return new Error(handledError)
    })
}

exports.deleteOne = async (userParams) => {
    if (!userParams._id && !userParams.email)
        return new Error("must get user _id or email");
    return await User.deleteOne(userParams).then(deletedUser => {
        if (deletedUser.deletedCount === 0){
            console.log("user is not exist")
            return new Error("user is not exist");
        }
        console.log("success deleted user") // TODO: add watson logger
        return "success";
    })
};

exports.updateOne = async (params) => {
    if (!params._id && !params.email)
        return new Error("must get user _id or email");

    let filter = {};
    params._id !== undefined ? filter["_id"] = params._id : "";
    params.email !== undefined ? filter["email"] = params.email : "";
    return await User.updateOne(filter, params.updatedUser, {runValidators: true}).then((user) => {
        if (!user) {
            return new Error("user is not found");
        }
        console.log("success update user") //TODO change to watson
        return "success";
    }).catch((error) => {
    console.log(error) //TODO change to watson
    let handledError = errorDuplicateKeyHandler(error)
    return new Error(handledError)
    });
}

exports.connect = async (userDetails) => {
    if (!userDetails.password || !userDetails.email)
        return new Error("must get email and a password");
    return await User.findOne({'email': userDetails.email}, 'hashedPassword _id role').then(async (user) => {
        if (!user) {
            return new Error("user is not exist");
        }
        const validPassword = await bcrypt.compare(userDetails.password, user.hashedPassword);
        if(validPassword){
            return generateToken(user.id, user.role);
        } // TODO add time limit
        return new Error("password is wrong");
    });
}

const generateToken = async (id, role) => {
    return {token : await jwt.sign({sub: id, role: role}, config.secret, { algorithm: "HS256", expiresIn: "1d" })}
}

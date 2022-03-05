const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config.json');
const { errorDuplicateKeyHandler } = require('./errorHandlers');
const logger = require("../logger");
const { ROLES } = require("../Models/Common/consts")
const User = require("../Models/User");
const { finished } = require('stream/promises');
const {PROFILE_IMAGES_PATH, PROFILE_IMAGE} = require('../consts');


async function uploadFile(file, fullPath, dirPath) {
    let { createReadStream, filename } = await file;
    let stream = createReadStream();
    let fullFileName =  new Date().getTime() + filename
    let out = require('fs').createWriteStream(fullPath + fullFileName);
    stream.pipe(out);
    await finished(out);
    return dirPath + fullFileName;
}

exports.createOne = async (inputUser, isAdmin = false) => {
    if(inputUser.file){
        const uploadImage = uploadFile(inputUser.file, PROFILE_IMAGES_PATH, PROFILE_IMAGE);
        await uploadImage.then(result => user.imagePath = result);
    }
    let userToCreate = inputUser.userParams;
    let address = {country: userToCreate.country, city: userToCreate.city, street: userToCreate.street}
    delete userToCreate.country;
    delete userToCreate.city;
    delete userToCreate.street;
    userToCreate.address = address;
    let user = new User(userToCreate);
    if(isAdmin){
        user.Role = ROLES.ADMIN;
    }
    return await user.save().then(savedUser => {
        logger.info("added a new user " + userToCreate.email)
        userToCreate.password = userToCreate.hashedPassword;
        return this.connect(userToCreate);
    }).catch(error => {
        logger.error("failed to add user :" + error.message)

        let handledError = errorDuplicateKeyHandler(error)
        return new Error(handledError)
    })
}

exports.deleteOne = async (userParams) => {
    if (!userParams._id && !userParams.email)
        return new Error("must get user _id or email");
    return await User.deleteOne(userParams).then(deletedUser => {
        if (deletedUser.deletedCount === 0){
            logger.info("user is not exist " + userParams.email);
            return new Error("user is not exist");
        }
        console.info("deleted user " + userParams.email)
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
        if (!user.acknowledged) {
            return new Error("user is not found");
        }
        logger.info("updated user " + params.email);
        return "success";
    }).catch((error) => {
    logger.error("failed to update user " + error)
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
        }
        return new Error("password is wrong");
    });
}

const generateToken = async (id, role) => {
    return {token : "Bearer " + await jwt.sign({sub: id, role: role}, config.secret, { algorithm: "HS256", expiresIn: "1d" })}
}

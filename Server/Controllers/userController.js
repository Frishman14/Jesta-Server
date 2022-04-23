const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config.json');
const { errorDuplicateKeyHandler } = require('./errorHandlers');
const logger = require("../logger");
const { ROLES } = require("../Models/Common/consts")
const User = require("../Models/User");
const { uploadFile, deleteFile } = require("./imageUtils")
const { PROFILE_IMAGES_PATH, PROFILE_IMAGE } = require('../consts');
const { ErrorId } = require('../utilities/error-id');
const {AuthenticationError} = require("apollo-server-express");

exports.createOne = async (inputUser, isAdmin = false) => {
    let userToCreate = inputUser.userParams;
    let user = new User(userToCreate);
    if(isAdmin){
        user.role = ROLES.ADMIN;
    }
    return await user.save().then(async savedUser => {
        if(inputUser.file){
            const uploadImage = uploadFile(inputUser.file, PROFILE_IMAGES_PATH, PROFILE_IMAGE);
            await uploadImage.then(result => inputUser.userParams.imagePath = result);
        }
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
    if (userParams.imagePath){
        deleteFile(userParams.imagePath);
    }
    return await User.deleteOne(userParams).then(deletedUser => {
        if (deletedUser.deletedCount === 0){
            logger.info("user is not exist " + userParams.email);
            return new Error(ErrorId.Invalid);
        }
        logger.info("deleted user " + userParams.email)
        return "success";
    })
};

exports.updateOneSecured = async (params) => {
    var connectionResult = await this.connect(params)
    if (connectionResult["token"] !== undefined){
        if(params["updateParams"]["accountDelete"]){
            return User.remove({_id: params._id}).then(u => "success").catch(err => {
                logger.error("failed to delete user " + err);
                return "failed";
            });
        }
        let parametersToUpdate = {};
        if(params["updateParams"]["email"] !== undefined){
            parametersToUpdate["email"] = params["updateParams"]["email"];
        }
        if(params["updateParams"]["password"] !== undefined){
            parametersToUpdate["password"] = params["updateParams"]["password"];
        }
        var filter = params._id !== undefined ? { '_id' : params._id } : {'email' : params.email }
        return User.findOneAndUpdate(filter,{ $set: parametersToUpdate }, {runValidators: true}).then(u => "success").catch(err => {
            logger.error("failed to update user " + err);
            return "failed";
        });
    }
    return new AuthenticationError("unauthorized");
}

exports.updateOne = async (params) => {
    if (!params._id && !params.email)
        return new Error(ErrorId.MissingParameters);
    let filter = {};
    params._id !== undefined ? filter["_id"] = params._id : "";
    params.email !== undefined ? filter["email"] = params.email : "";
    if (params["newImage"]){
        let user = await User.findOne(filter).exec();
        if(user.imagePath) deleteFile(user.imagePath);
        const uploadImage = uploadFile(params["newImage"], PROFILE_IMAGES_PATH, PROFILE_IMAGE);
        await uploadImage.then(result => params.updatedUser.imagePath = result);
    }
    return await User.updateOne(filter, params.updatedUser, {runValidators: true}).then((user) => {
        if (!user.acknowledged) {
            return new Error(ErrorId.Invalid);
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
    if (!userDetails.password && (!userDetails.email || !userDetails._id))
        return new Error(ErrorId.MissingParameters);
    var filter = userDetails._id !== undefined ? { '_id' : userDetails._id } : {'email' : userDetails.email }
    return await User.findOne(filter, 'hashedPassword _id role').then(async (user) => {
        if (!user) {
            return new Error(ErrorId.Invalid);
        }
        const validPassword = await bcrypt.compare(userDetails.password, user.hashedPassword);
        if(validPassword){
            return {token: await generateToken(user.id, user.role), userId: user.id };
        }
        return new Error(ErrorId.Invalid);
    });
}

const generateToken = async (id, role) => {
    return  "Bearer " + await jwt.sign({sub: id, role: role}, config.secret, { algorithm: "HS256", expiresIn: "7d" })
}

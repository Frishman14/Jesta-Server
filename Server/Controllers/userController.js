const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config.json');
const { errorDuplicateKeyHandler } = require('./errorHandlers');
const logger = require("../logger");
const { ROLES } = require("../Models/Common/consts")
const User = require("../Models/User");
const Graph = require("../Models/UserGraph");
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
    return await user.save().then(async _ => {
        if(inputUser.file){
            user.imagePath = await uploadFile(inputUser.file, PROFILE_IMAGES_PATH, PROFILE_IMAGE);
            await user.save();
        }
        updateUserCreatedGraph()
        logger.info("added a new user " + userToCreate.email)
        userToCreate.password = userToCreate.hashedPassword;
        return this.connect(userToCreate);
    }).catch(error => {
        logger.error("failed to add user :" + error.message)
        let handledError = errorDuplicateKeyHandler(error)
        return new Error(handledError)
    })
}

const updateUserCreatedGraph = () => {
    Graph.exists({creationDate: new Date().toLocaleDateString()}, async function(err, exists) {
        if (err) {
            logger.error("problem with update user graph", err);
        }
        if (exists) {
            Graph.findOne({creationDate: new Date().toLocaleDateString()}, async function(_, doc) {
                await Graph.updateOne({_id: doc._id},{numberOfCreated: doc.numberOfCreated + 1}).exec();
            })
        } else {
            await Graph.create({creationDate: new Date().toLocaleDateString(), numberOfCreated: 1});
        }
    })
}

exports.createToken = async (context, args) => {
    await User.updateOne({_id: context.sub}, {$set: {notificationToken: args["token"]}}).exec();
    return "success"
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
    const connectionResult = await this.connect(params);
    if (connectionResult["token"] !== undefined){
        if(params["updateParams"]["accountDelete"]){
            return User.remove({_id: params._id}).then(_ => "success").catch(err => {
                logger.error("failed to delete user " + err);
                return "failed";
            });
        }
        let parametersToUpdate = {};
        if(params["updateParams"]["email"] !== undefined){
            parametersToUpdate["email"] = params["updateParams"]["email"];
            if (await User.exists({"email": params["updateParams"]["email"]})){
                return new Error(ErrorId.Exists)
            }
        }
        if(params["updateParams"]["password"] !== undefined){
            parametersToUpdate["password"] = params["updateParams"]["password"];
        }
        const filter = params._id !== undefined ? {'_id': params._id} : {'email': params.email};
        return User.findOneAndUpdate(filter,{ $set: parametersToUpdate }, {runValidators: true}).then(_ => "success").catch(err => {
            logger.error("failed to update user " + err);
            return "failed";
        });
    }
    return new AuthenticationError("unauthorized");
}

exports.updateOne = async (params) => {
    if(params.updatedUser === null || params.updatedUser === undefined ) {
        params.updatedUser = {}
    }
    if(params.updatedUser.fullAddress !== null && params.updatedUser.fullAddress !== undefined) {
        params.updatedUser.address = { "fullAddress" : params.updatedUser.fullAddress };
    }
    if (!params._id && !params.email){
        return new Error(ErrorId.MissingParameters);
    }
    const filter = {};
    if( params._id !== undefined && params._id !== null) {
        filter._id = params._id;
    } else if (params.email !== undefined && params.email !== null) {
        filter["email"] =params.email;
    }
    if (params["newImage"] !== null && params["newImage"] !== undefined ){
        let user = await User.findOne(filter).exec();
        if(user.imagePath !== null && user.imagePath !== undefined && user.imagePath !== "" ){
            deleteFile(user.imagePath);
        }
        params.updatedUser.imagePath = await uploadFile(params.newImage, PROFILE_IMAGES_PATH, PROFILE_IMAGE);
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

exports.getThreeMostExecutors = async () => {
    return await User.find().sort('-numberOfExecutedJesta').limit(3).exec();
}

const generateToken = async (id, role) => {
    return  "Bearer " + await jwt.sign({sub: id, role: role}, config.secret, { algorithm: "HS256", expiresIn: "7d" })
}

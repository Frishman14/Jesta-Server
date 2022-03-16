const logger = require("../logger");
const Favor = require("../Models/favors/Favor");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const {decodeToken} = require("../middlewares/authorize");
const {ROLES} = require("../Models/Common/consts");

exports.createOne = async (args) => {
    let favor = new Favor(args.favor)
    return await favor.save().then((savedFavor) => {
        logger.debug("created new favor " + savedFavor._id);
        return savedFavor;
    }).catch(error => {
        logger.debug("error in creating new favor " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.deleteOne = async (params, token) => {
    if (!params._id) return new Error("must get id");
    if (!await validateDetails(params, token)) return new Error("unautorized to delete someone else favor");
    return await Favor.deleteOne(params).then(deletedFavor => {
        if (deletedFavor.deletedCount === 0) {
            logger.debug("favor is not exist");
            return new Error("category is not exist");
        }
        logger.debug("deleted favor")
        return "success";
    })
}

exports.updateOne = async (params, token) => {
    // TODO: fix it
    if (!params._id) return new Error("must get id");
    if (!await validateDetails(params, token)) return new Error("unautorized to update someone else favor");
    return await Favor.updateOne(params).then(updatedFavor => {
        if (deletedFavor.deletedCount === 0) {
            logger.debug("favor is not exist");
            return new Error("category is not exist");
        }
        logger.debug("deleted favor")
        return "success";
    })
}

async function validateDetails(params, token){
    userDetails = decodeToken(token)
    favor = await Favor.findOne({_id: params._id}).exec()
    return !(userDetails.role !== ROLES.ADMIN || favor.ownerId !== userDetails.sub);
}
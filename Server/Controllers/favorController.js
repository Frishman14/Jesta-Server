const logger = require("../logger");
const Favor = require("../Models/favors/Favor");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { kmToRadian } = require("./geoLocationUtils");
const {ROLES} = require("../Models/Common/consts");
const {FAVOR_IMAGES_PATH, FAVOR_IMAGE} = require("../consts");
const { uploadFile } = require("./imageUtils")

exports.createOne = async (args) => {
    if(args.image){
        await uploadFile(args.image, FAVOR_IMAGES_PATH, FAVOR_IMAGE).then(result => args.favor.imagesPath = [result]);
    }
    let favor = new Favor(args["favor"])
    return await favor.save().then((savedFavor) => {
        logger.debug("created new favor " + savedFavor._id);
        return savedFavor;
    }).catch(error => {
        logger.debug("error in creating new favor " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.deleteOne = async (params, token) => {
    if (!params.favorId) return new Error("must get id");
    if (!await validateDetails(params, token)) return new Error("unauthorized to delete someone else favor");
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
    if (!params.favorId) return new Error("must get favor id");
    if (!await validateDetails(params, token)) return new Error("unauthorized to update someone else favor");
    return await Favor.updateOne({_id: params.favorId}, params["updatedFavor"]).then(updatedFavor => {
        if(updatedFavor.modifiedCount === 1) {
            return "success";
        }
        return "failed"
    }).catch(error => {
        logger.error("failed to update favor")
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.findByRadios = async (params) => {
    let query = {
        "sourceAddress.location" : {
                $geoWithin: {
                    $centerSphere: [params.center, kmToRadian(params["radius"])]
                }
        }
    };
    return await Favor.find(query).exec();
}

// TODO: get all by category

async function validateDetails(params, token){
    let userDetails = token
    let favor = await Favor.findOne({_id: params.favorId}).exec()
    return userDetails.role === ROLES.ADMIN || favor.ownerId.toString() === userDetails.sub;
}

const logger = require("../logger");
const Favor = require("../Models/favors/Favor");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { kmToRadian } = require("./geoLocationUtils");
const {ROLES, JESTA_STATUS} = require("../Models/Common/consts");
const {FAVOR_IMAGES_PATH, FAVOR_IMAGE} = require("../consts");
const { uploadFile } = require("./imageUtils");
const { ErrorId } = require("../utilities/error-id");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");

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
    if (!params.favorId) return new Error(ErrorId.MissingParameters);
    if (!await validateDetails(params, token)) return new Error(ErrorId.Unauthorized); // unauthorized to delete someone else favor
    return await Favor.deleteOne(params).then(deletedFavor => {
        if (deletedFavor.deletedCount === 0) {
            logger.debug("favor is not exist");
            return new Error(ErrorId.NotExists); // category is not exist
        }
        logger.debug("deleted favor")
        return "success";
    })
}

exports.updateOne = async (params, token) => {
    if (!params.favorId) return new Error(ErrorId.MissingParameters);
    if (!await validateDetails(params, token)) return new Error(ErrorId.Unauthorized); // unauthorized to update someone else favor
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

exports.findByRadiosAndDateAndOnlyAvailable = async (params) => {
    let query = {
        "dateToPublish": {
            $gte: startOfDay(new Date(params["startingDate"]) - 24*60*60*1000),
            $lt: endOfDay(new Date(params["limitDate"]))
        },
        "sourceAddress.location" : {
            $geoWithin: {
                $centerSphere: [params.center, kmToRadian(params["radius"])]
            }
        },
        "status": JESTA_STATUS.AVAILABLE
    };
    return await Favor.find(query).exec();
}

async function validateDetails(params, token){
    let userDetails = token
    let favor = await Favor.findOne({_id: params.favorId}).exec()
    return userDetails.role === ROLES.ADMIN || favor.ownerId.toString() === userDetails.sub;
}

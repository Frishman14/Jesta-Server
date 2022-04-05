const logger = require("../logger");
const Perform = require("../Models/favors/perform");
const { kmToRadian } = require("./geoLocationUtils");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const {ROLES} = require("../Models/Common/consts");
const { ErrorId } = require("../utilities/error-id");

exports.createOne = async (args) => {
    let perform = new Perform(args["perform"])
    return await perform.save().then((savedPerform) => {
        logger.debug("created new perform " + savedPerform._id);
        return savedPerform;
    }).catch(error => {
        logger.debug("error in creating new perform " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.deleteOne = async (params, token) => {
    if (!params.performId) return new Error(ErrorId.MissingParameters);
    if (!await validateDetails(params, token)) return new Error(ErrorId.Unauthorized); // unauthorized to delete someone else perform
    return await Perform.deleteOne(params).then(deletedPerform => {
        if (deletedPerform.deletedCount === 0) {
            logger.debug("perform is not exist");
            return new Error(ErrorId.Exists);
        }
        logger.debug("deleted perform")
        return "success";
    })
}

exports.updateOne = async (params, token) => {
    if (!params["performId"]) return new Error(ErrorId.Exists);
    if (!await validateDetails(params, token)) return new Error(ErrorId.Unauthorized); // unauthorized to delete someone else perform
    return await Perform.updateOne({_id: params["performId"]}, params["updatedPerform"]).then(updatedPerform => {
        if(updatedPerform.matchedCount === 1) {
            return "success";
        }
        return new Error("failed to update perform");
    }).catch(error => {
        logger.error("failed to update favor")
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.findByRadios = async (params) => {
    let query = {
        "address.location" : {
                $geoWithin: {
                    $centerSphere: [params.center, kmToRadian(params["radius"])]
                }
        }
    };
    return await Perform.find(query).exec();
}

async function validateDetails(params, token){
    let userDetails = token
    let perform = await Perform.findOne({_id: params["performId"]}).exec()
    return userDetails.role === ROLES.ADMIN || perform.performerId.toString() === userDetails.sub;
}
const logger = require("../logger");
const Favor = require("../Models/favors/Favor");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { kmToRadian } = require("./geoLocationUtils");
const {ROLES, JESTA_STATUS} = require("../Models/Common/consts");
const {FAVOR_IMAGES_PATH, FAVOR_IMAGE} = require("../consts");
const { uploadFile, deleteFile } = require("./imageUtils");
const { ErrorId } = require("../utilities/error-id");
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const Graph = require("../Models/favors/JestaGraph");

exports.createOne = async (args) => {
    const imagesPath = []
    if(args["images"] && args["images"].length > 0) {
        for(let i = 0 ; i < args["images"].length; i++){
            imagesPath.push(await uploadFile(args["images"][i], FAVOR_IMAGES_PATH, FAVOR_IMAGE));
        }
    }
    let favor = new Favor(args["favor"])
    favor["imagesPath"] = imagesPath;
    if (args["favor"]["dateToPublish"] === null || args["favor"]["dateToPublish"] === undefined){
        favor["dateToPublish"] = Date.now();
    }
    return await favor.save().then((savedFavor) => {
        updateJestaCreatedGraph();
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
    return await Favor.findByIdAndDelete(params.favorId).then((deletedFavor) => {
        if(deletedFavor["imagesPath"] && deletedFavor["imagesPath"].length > 0){
            deletedFavor.imagesPath.forEach(image => {
                deleteFile(image);
            })
        }
        logger.debug("deleted favor")
        return "success";
    }).catch(err => {
        logger.debug("favor deletion problem " + err);
        return new Error(ErrorId.NotExists); // category is not exist
    })
}

exports.updateOne = async (params, token) => {
    if (!params.favorId) return new Error(ErrorId.MissingParameters);
    if (!await validateDetails(params, token)) return new Error(ErrorId.Unauthorized); // unauthorized to update someone else favor
    return await Favor.findByIdAndUpdate(params.favorId, params["updatedFavor"]).then(async updatedFavor => {
        if(params["newImages"]){
            if(updatedFavor["imagesPath"] && updatedFavor["imagesPath"].length > 0){
                updatedFavor.imagesPath.forEach(image => {
                    deleteFile(image);
                })
            }
            const imagesPath = []
            for (const image of params["newImages"]) {
                imagesPath.push(await uploadFile(image, FAVOR_IMAGES_PATH, FAVOR_IMAGE));
            }
            await Favor.updateOne(params.favorId, {imagesPath: imagesPath}).exec();
        }
        return "success"
    }).catch(error => {
        logger.error("failed to update favor")
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.findByRadios = async (params) => {
    let query = {
        "sourceAddress.location" : {
                $geoWithin: {
                    $centerSphere: [params.center, kmToRadian(params["radius"] * 0.9)]
                }
        }
    };
    return await Favor.find(query).exec();
}

exports.findByRadiosAndDateAndOnlyAvailable = async (params, context) => {
    let dateYearAgo = new Date().getDate() - 365;
    let dateYearLater = new Date().getDate() + 365;
    let startingDate = params["startingDate"] === null ? startOfDay(new Date().setDate(dateYearAgo)) : startOfDay(new Date(params["startingDate"]) - 24*60*60*1000);
    let limitDate = params["limitDate"] === null ? endOfDay(new Date().setDate(dateYearLater)) : endOfDay(new Date(params["limitDate"]));
    let query = {
        "dateToPublish": {
            $gte: startingDate,
        },
        "dateToExecute": {$lte: limitDate},
        "sourceAddress.location" : {
            $geoWithin: {
                $centerSphere: [params.center, kmToRadian(params["radius"] * 0.9)]
            }
        },
        "status": JESTA_STATUS.AVAILABLE
    };
    if(params["notIncludeMe"]){
        query["ownerId"] = { $ne: context.sub }
    }
    return await Favor.find(query).exec();
}

async function validateDetails(params, token){
    let userDetails = token
    let favor = await Favor.findOne({_id: params.favorId}).exec()
    return userDetails.role === ROLES.ADMIN || favor.ownerId.toString() === userDetails.sub;
}

const updateJestaCreatedGraph = () => {
    Graph.exists({creationDate: new Date().toLocaleDateString()}, async function(err, exists) {
        if (err) {
            logger.error("problem with update jesta graph", err);
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

const logger = require("../logger");
const FavorTransactions = require("../Models/favors/FavorTransactions");
const Favor = require("../Models/favors/Favor");
const {ROLES} = require("../Models/Common/consts");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { ErrorId } = require("../utilities/error-id");

exports.createRequest = async (args, context) => {
    let favorTransaction = new FavorTransactions();
    let favor = await Favor.findById(args.favorId).exec();
    favorTransaction["favorId"] = args.favorId;
    favorTransaction["handledByUserId"] = context.sub;
    favorTransaction["handlerComment"] = args.comment;
    favorTransaction["favorOwnerId"] = favor["ownerId"];
    return await favorTransaction.save().then((savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in creating new transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.cancelRequest = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if(favorTransaction["handledByUserId"] !== context.sub && context.role !== ROLES.ADMIN) {
        return new Error(ErrorId.Unauthorized); // Unauthorized to delete not your own request
    }
    return await favorTransaction.delete().then((deletedTransactionRequest) => {
        logger.debug("deleted transaction request " + deletedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in deleteing transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.handleRequest = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if(args.status === "Approved"){
        favorTransaction["status"] = "Approved"
    } else if (args.status === "Canceled"){
        favorTransaction["status"] = "Canceled"
    } else {
        return new Error("Unknown status")
    }
    return await favorTransaction.save().then((savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in updating transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}
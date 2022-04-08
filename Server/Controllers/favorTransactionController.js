const logger = require("../logger");
const FavorTransactions = require("../Models/favors/FavorTransactions");
const Favor = require("../Models/favors/Favor");
const {ROLES, JESTA_TRANSACTION_STATUS, JESTA_STATUS} = require("../Models/Common/consts");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { ErrorId } = require("../utilities/error-id");

exports.createRequest = async (args, context) => {
    let favorTransaction = new FavorTransactions();
    let favor = await Favor.findById(args.favorId).exec();
    favorTransaction["favorId"] = args.favorId;
    favorTransaction["handledByUserId"] = context.sub;
    favorTransaction["handlerComment"] = args.comment;
    favorTransaction["favorOwnerId"] = favor["ownerId"];
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.PENDING_FOR_OWNER;
    return await favorTransaction.save().then((savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in creating new transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.cancelRequest = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).populate("favorId").exec();
    if(favorTransaction["handledByUserId"] !== context.sub && context.role !== ROLES.ADMIN) {
        return new Error(ErrorId.Unauthorized); // Unauthorized to delete not your own request
    }
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.WAITING;
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
    return await favorTransaction.save().then(async (savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        let favor = Favor.findById(favorTransaction.favorId).exec();
        favor.status = JESTA_STATUS.UNAVAILABLE;
        await favor.save().exec();
        return "Success";
    }).catch(error => {
        logger.debug("error in updating transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.executorNotifyDoneFavor = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if (context.sub !== favorTransaction["handledByUserId"]){
        return new Error(ErrorId.Unauthorized);
    }
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.EXECUTOR_FINISH_JESTA;
    return await favorTransaction.save().then((favorNotified) => {
        logger.debug("executor notify for doing jesta " + favorNotified._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in notify for doing jesta " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.ownerNotifyJestaHasBeenDone = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if (context.sub !== favorTransaction["favorOwnerId"]){
        return new Error(ErrorId.Unauthorized);
    }
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.JESTA_DONE;
    return await favorTransaction.save().then(async (favorNotified) => {
        let favor = Favor.findById(favorTransaction["favorOwnerId"]).exec();
        favor["statue"] = JESTA_STATUS.UNAVAILABLE;
        favor.save().exec();
        logger.debug("owner notify jesta has been done" + favorNotified._id);
        return "Success";
    }).catch(error => {
        logger.debug("owner failed to notify jesta has been done" + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}
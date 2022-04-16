const logger = require("../logger");
const FavorTransactions = require("../Models/favors/FavorTransactions");
const Favor = require("../Models/favors/Favor");
const {ROLES, JESTA_TRANSACTION_STATUS, JESTA_STATUS} = require("../Models/Common/consts");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { ErrorId } = require("../utilities/error-id");
const {AuthenticationError} = require("apollo-server-express");

exports.createRequest = async (args, context) => {
    let favorTransaction = new FavorTransactions();
    let favor = await Favor.findById(args.favorId).exec();
    favorTransaction["favorId"] = args.favorId;
    favorTransaction["handledByUserId"] = context.sub;
    favorTransaction["handlerComment"] = args.comment;
    favorTransaction["favorOwnerId"] = favor["ownerId"];
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.PENDING_FOR_OWNER;
    if (await FavorTransactions.exists({favorId: favorTransaction["favorId"],handledByUserId: favorTransaction["handledByUserId"],favorOwnerId: favorTransaction["favorOwnerId"]})){
        return new Error(ErrorId.Exists);
    }
    return await favorTransaction.save().then((savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in creating new transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.handleRequestApproved = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    favorTransaction.status = JESTA_TRANSACTION_STATUS.WAITING_FOR_JESTA_EXECUTION_TIME;
    return await favorTransaction.save().then(async (savedTransactionRequest) => {
        logger.debug("transaction approved " + savedTransactionRequest._id);
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        return "Success";
    }).catch(error => {
        logger.debug("error in approved transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.handleRequestCanceled = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if(favorTransaction["favorOwnerId"] !== context.sub.toString() && favorTransaction["handledByUserId"] !== context.sub.toString() && context.role !== ROLES.ADMIN){
        return new AuthenticationError("unauthorized");
    }
    favorTransaction.status = JESTA_TRANSACTION_STATUS.CANCELED;
    return await favorTransaction.save().then(async (savedTransactionRequest) => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.AVAILABLE}).exec();
        logger.debug("transaction request canceled " + savedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in transaction request canceled " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.executorNotifyDoneFavor = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if (context.sub !== favorTransaction["handledByUserId"].toString()){
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
    if (context.sub !== favorTransaction["favorOwnerId"].toString()){
        return new Error(ErrorId.Unauthorized);
    }
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.JESTA_DONE;
    return await favorTransaction.save().then(async (favorNotified) => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        logger.debug("owner notify jesta has been done" + favorNotified._id);
        return "Success";
    }).catch(error => {
        logger.debug("owner failed to notify jesta has been done" + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}
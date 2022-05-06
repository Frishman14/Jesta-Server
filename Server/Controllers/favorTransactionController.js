const logger = require("../logger");
const FavorTransactions = require("../Models/favors/FavorTransactions");
const Favor = require("../Models/favors/Favor");
const User = require("../Models/User");
const {ROLES, JESTA_TRANSACTION_STATUS, JESTA_STATUS} = require("../Models/Common/consts");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { ErrorId } = require("../utilities/error-id");
const {AuthenticationError} = require("apollo-server-express");
const {getMessaging} = require("firebase-admin/messaging");
const {sentToOneUserMessage} = require("../Services/firebase-messaging");
const favorTransaction = require("../Models/favors/FavorTransactions");

exports.createRequest = async (args, context) => {
    let favorTransaction = new FavorTransactions();
    let favor = await Favor.findById(args.favorId).exec();
    if (favor["ownerId"] === favorTransaction["handledByUserId"]){
        return new Error(ErrorId.Invalid);
    }
    favorTransaction["favorId"] = args.favorId;
    favorTransaction["handledByUserId"] = context.sub;
    favorTransaction["handlerComment"] = args.comment;
    favorTransaction["favorOwnerId"] = favor["ownerId"];
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.PENDING_FOR_OWNER;
    if (await FavorTransactions.exists({favorId: favorTransaction["favorId"],handledByUserId: favorTransaction["handledByUserId"],favorOwnerId: favorTransaction["favorOwnerId"]})){
        return new Error(ErrorId.Exists);
    }
    return await favorTransaction.save().then( async (savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        let user = await User.findById(favorTransaction["favorOwnerId"]).exec();
        if ( user["notificationToken"] !== null || user["notificationToken"] !== undefined){
            logger.debug("sending notification to " + favorTransaction["favorOwnerId"])
            const message = {
                notification : {
                    "title":"מישהו שלח לך ג'סטה",
                    "body": "בוא בדוק מי זה"
                }
            };
            sentToOneUserMessage(user["notificationToken"],message,"high")
        }
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
        let user = await User.findById(favorTransaction["handledByUserId"]).exec();
        if ( user["notificationToken"] !== null || user["notificationToken"] !== undefined){
            logger.debug("sending notification to " + favorTransaction["handledByUserId"])
            const message = {
                notification : {
                    "title":"מישהו אישר את הבקשה שלך לעשות ג'סטה",
                    "body": "בוא בדוק מי זה"
                }
            };
            sentToOneUserMessage(user["notificationToken"],message,"high")
        }
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        return "Success";
    }).catch(error => {
        logger.debug("error in approved transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.handleRequestCanceled = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if(favorTransaction["favorOwnerId"].toString() !== context.sub && favorTransaction["handledByUserId"].toString() !== context.sub && context.role !== ROLES.ADMIN){
        return new AuthenticationError("unauthorized");
    }
    favorTransaction.status = JESTA_TRANSACTION_STATUS.CANCELED;
    favorTransaction.canceledBy = context.sub;
    return await favorTransaction.save().then(async (savedTransactionRequest) => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.AVAILABLE}).exec();
        logger.debug("transaction request canceled " + savedTransactionRequest._id);
        return "Success";
    }).catch(error => {
        logger.debug("error in transaction request canceled " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.getFavorTransactionByStatusAndHandlerOrExecutorAndDate = async (byOwnerId,args, context) => {
    const executorFilter = byOwnerId === true ? "favorOwnerId" : "handledByUserId";
    let query = {
        status: JESTA_TRANSACTION_STATUS[args.status]
    }
    query[executorFilter] = context.sub;
    if (args["fromDate"] !== null && args["fromDate"] !== undefined){
        console.log(args["fromDate"])
        query["dateLastModified"] = {$gte: args["fromDate"]};
    }
    return await favorTransaction.find(query).populate("favorOwnerId favorId handledByUserId").sort({"dateCompleted": -1}).exec()
}

exports.executorNotifyDoneFavor = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if (context.sub !== favorTransaction["handledByUserId"].toString()){
        return new Error(ErrorId.Unauthorized);
    }
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.EXECUTOR_FINISH_JESTA;
    return await favorTransaction.save().then(async (favorNotified) => {
        logger.debug("executor notify for doing jesta " + favorNotified._id);
        let user = await User.findById(favorTransaction["favorOwnerId"]).exec();
        if ( user["notificationToken"] !== null || user["notificationToken"] !== undefined){
            logger.debug("sending notification to " + favorTransaction["favorOwnerId"])
            const message = {
                notification : {
                    "title":"ביצעו את הג'סטה שלך",
                    "body": "בוא בדוק מי זה ואשר זאת"
                }
            };
            sentToOneUserMessage(user["notificationToken"],message,"high")
        }
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
    if(args["rate"]) {
        favorTransaction["rating"] = args["rate"]
    }
    return await favorTransaction.save().then(async (favorNotified) => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        logger.debug("owner notify jesta has been done" + favorNotified._id);
        if(args["rate"] !== undefined){
            await rateUserAndAddJesta(favorTransaction["handledByUserId"], args["rate"])
        }
        return "Success";
    }).catch(error => {
        logger.debug("owner failed to notify jesta has been done " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

const rateUserAndAddJesta = async (userId, rating) => {
    User.findOne(userId).then(user => {
        let numOfRates = isNaN(user["number_of_rates"]) ? 1 : user["numberOfRates"];
        let currentRating = isNaN(user["rating"]) ? 5 : user["rating"];
        let newRating = ((numOfRates * currentRating) + rating)/(numOfRates+1);

        let numberOfExecutedJesta = user["numberOfExecutedJesta"]

        User.updateOne({ "_id": userId },{$set : {"numberOfRates" : numOfRates + 1, "rating": newRating, "numberOfExecutedJesta": numberOfExecutedJesta + 1 }}).exec();
    })
}
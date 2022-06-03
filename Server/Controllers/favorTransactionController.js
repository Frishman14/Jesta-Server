const logger = require("../logger");
const FavorTransactions = require("../Models/favors/FavorTransactions");
const Favor = require("../Models/favors/Favor");
const User = require("../Models/User");
const {ROLES, JESTA_TRANSACTION_STATUS, JESTA_STATUS} = require("../Models/Common/consts");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const { ErrorId } = require("../utilities/error-id");
const {AuthenticationError} = require("apollo-server-express");
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
        await FavorTransactions.updateOne({favorId: favorTransaction["favorId"],handledByUserId: favorTransaction["handledByUserId"],favorOwnerId: favorTransaction["favorOwnerId"]}, {status: JESTA_TRANSACTION_STATUS.PENDING_FOR_OWNER}).exec();
        await sendCreateMessage(favorTransaction["favorOwnerId"])
        return "Success"
    }
    return await favorTransaction.save().then( async (savedTransactionRequest) => {
        logger.debug("created new transaction request " + savedTransactionRequest._id);
        await sendCreateMessage(favorTransaction["favorOwnerId"])
        return "Success";
    }).catch(error => {
        logger.debug("error in creating new transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

const sendCreateMessage = async (favorOwnerId) => {
    let user = await User.findById(favorOwnerId).exec();
    if ( user["notificationToken"] !== null && user["notificationToken"] !== undefined){
        logger.debug("sending notification to " + favorTransaction["favorOwnerId"])
        const message = {
            notification : {
                "title":"מישהו שלח לך ג'סטה",
                "body": "בוא בדוק מי זה"
            }
        };
        sentToOneUserMessage(user["notificationToken"],message,"high")
    }
}

exports.handleRequestApproved = async (args, _) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    let favor = await Favor.findById(favorTransaction["favorId"]).exec();
    let favorsInWaitingForMoreApprovalStatus = await FavorTransactions.find({"favorId": {$eq: favorTransaction["favorId"]}, "status": {$eq: JESTA_TRANSACTION_STATUS.WAITING_FOR_MORE_APPROVAL}}).exec();
    console.log(favor["numOfPeopleNeeded"] > 1 && favorsInWaitingForMoreApprovalStatus.length === favor["numOfPeopleNeeded"] - 1)
    if (favor["numOfPeopleNeeded"] > 1 && favorsInWaitingForMoreApprovalStatus.length < favor["numOfPeopleNeeded"] - 1) {
        favorTransaction.status = JESTA_TRANSACTION_STATUS.WAITING_FOR_MORE_APPROVAL;
        return await favorTransaction.save().then(async (savedTransactionRequest) => {
            logger.debug("transaction approved and waiting " + savedTransactionRequest._id);
            let user = await User.findById(favorTransaction["handledByUserId"]).exec();
            if (user["notificationToken"] !== null && user["notificationToken"] !== undefined) {
                logger.debug("sending notification to " + favorTransaction["handledByUserId"])
                const message = {
                    notification: {
                        "title": "מישהו אישר את הבקשה שלך לעשות ג'סטה אך מחכים לאנשים נוספים",
                        "body": "בוא בדוק מי זה"
                    }
                };
                sentToOneUserMessage(user["notificationToken"], message, "high")
            }
            return "Success";
        }).catch(error => {
            logger.debug("error in approved transaction " + error);
            return new Error(errorDuplicateKeyHandler(error))
        });
    } else if (favor["numOfPeopleNeeded"] > 1 && favorsInWaitingForMoreApprovalStatus.length === favor["numOfPeopleNeeded"] - 1 || favorsInWaitingForMoreApprovalStatus.length === favor["numOfPeopleNeeded"]) {
        logger.debug("enough people approved");
        favorTransaction.status = JESTA_TRANSACTION_STATUS.WAITING_FOR_JESTA_EXECUTION_TIME;
        await favorTransaction.save().exec();
        await FavorTransactions.updateMany({favorId: favorTransaction["favorId"],
                status: JESTA_TRANSACTION_STATUS.WAITING_FOR_MORE_APPROVAL
        }, {status: JESTA_TRANSACTION_STATUS.WAITING_FOR_JESTA_EXECUTION_TIME}).exec();
        await favorsInWaitingForMoreApprovalStatus.foreach(async favor => {
            let user = await User.findById(favor["handledByUserId"]).exec();
            if ( user["notificationToken"] !== null && user["notificationToken"] !== undefined){
                logger.debug("sending notification to " + favorTransaction["handledByUserId"])
                const message = {
                    notification : {
                        "title":"שמחים לבשר לך שיש מספיק אנשים לג'סטה שרצית לעשות!",
                        "body": "בוא וראה איזה ג'סטה"
                    }
                };
                await sentToOneUserMessage(user["notificationToken"],message,"high")
            }
            await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        }).catch(error => {
            logger.debug("error in approved transaction " + error);
            return new Error(errorDuplicateKeyHandler(error))
        });
        return "success";
    }
    favorTransaction.status = JESTA_TRANSACTION_STATUS.WAITING_FOR_JESTA_EXECUTION_TIME;
    return await favorTransaction.save().then(async (savedTransactionRequest) => {
        await FavorTransactions.updateMany({ favorId: favorTransaction.favorId.toString(), _id :{$ne : args["favorTransactionId"]}  }, {status: JESTA_TRANSACTION_STATUS.CANCELED}).exec()
        logger.debug("transaction approved " + savedTransactionRequest._id);
        let user = await User.findById(favorTransaction["handledByUserId"]).exec();
        if ( user["notificationToken"] !== null && user["notificationToken"] !== undefined){
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
    let userId = favorTransaction["favorOwnerId"].toString() === context.sub ? favorTransaction["favorOwnerId"] : favorTransaction["handledByUserId"];
    favorTransaction.status = JESTA_TRANSACTION_STATUS.CANCELED;
    favorTransaction.canceledBy = context.sub;
    return await favorTransaction.save().then(async (savedTransactionRequest) => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.AVAILABLE}).exec();
        logger.debug("transaction request canceled " + savedTransactionRequest._id);
        let user = await User.findById(userId).exec();
        if ( user["notificationToken"] !== null && user["notificationToken"] !== undefined){
            logger.debug("sending notification to " + favorTransaction["handledByUserId"])
            const message = {
                notification : {
                    "title":"מישהו ביטל ג'סטה שאתה מעורב בה",
                    "body": "בוא בדוק מי זה ואיזה ג'סטה"
                }
            };
            sentToOneUserMessage(user["notificationToken"],message,"high")
        }
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
        if ( user["notificationToken"] !== null && user["notificationToken"] !== undefined){
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
    favorTransaction["handlerComment"] = args["handlerComment"];
    if(args["rate"]) {
        favorTransaction["rating"] = args["rate"]
    }
    return await favorTransaction.save().then(async (favorNotified) => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        logger.debug("owner notify jesta has been done" + favorNotified._id);
        if(args["rate"] !== undefined){
            await rateUserAndAddJesta(favorTransaction["handledByUserId"], args["rate"], true)
        }
        return "Success";
    }).catch(error => {
        logger.debug("owner failed to notify jesta has been done " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.ownerRateJestaAndComment = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if (context.sub !== favorTransaction["favorOwnerId"].toString()){
        return new Error(ErrorId.Unauthorized);
    }
    favorTransaction["handlerComment"] = args["handlerComment"] !== null ? args["handlerComment"] : "";
    if(!args["rate"]) {
        return new Error(ErrorId.MissingParameters)
    }
    favorTransaction["rating"] = args["rate"]
    return await favorTransaction.save().then(async (_) => {
        if(args["rate"] !== undefined){
            await rateUserAndAddJesta(favorTransaction["handledByUserId"], args["rate"], false)
        }
        return "Success";
    }).catch(error => {
        logger.debug("owner failed to rate transaction " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.userChangeJestaTransactionToClosed = async (args, context) => {
    let favorTransaction = await FavorTransactions.findById(args["favorTransactionId"]).exec();
    if (context.sub !== favorTransaction["handledByUserId"].toString() && context.role !== ROLES.ADMIN){
        return new Error(ErrorId.Unauthorized);
    }
    favorTransaction["status"] = JESTA_TRANSACTION_STATUS.CLOSED;
    return await favorTransaction.save().then(async () => {
        await Favor.updateOne({_id:favorTransaction.favorId},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        logger.debug("owner notify jesta has been closed" + favorTransaction.favorId);
        return "Success";
    }).catch(error => {
        logger.debug("owner failed to closed jesta " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

const rateUserAndAddJesta = async (userId, rating, jestaExecuted) => {
    User.findOne(userId).then(user => {
        let numOfRates = isNaN(user["number_of_rates"]) ? 1 : user["numberOfRates"];
        let currentRating = isNaN(user["rating"]) ? 5 : user["rating"];
        let newRating = ((numOfRates * currentRating) + rating)/(numOfRates+1);

        let numberOfExecutedJesta = user["numberOfExecutedJesta"]
        if (rating > 3 && jestaExecuted) {
            let user = User.updateOne({"_id": userId}, {
                $set: {
                    "numberOfRates": numOfRates + 1,
                    "rating": newRating,
                    "numberOfExecutedJesta": numberOfExecutedJesta + 1
                }
            }).exec();
            sendMedalNotification(user)
        } else {
            User.updateOne({ "_id": userId },{$set : {"numberOfRates" : numOfRates + 1, "rating": newRating}}).exec();
            sendMedalNotification(user)
        }
    })
}

const sendMedalNotification = async (user) => {
    if (user["notificationToken"] === null || user["notificationToken"] === undefined) {
        return;
    }
    let numOfExecuted = user["numberOfExecutedJesta"];
    switch (numOfExecuted) {
        case 10:
            sentToOneUserMessage("notificationToken",message(10),"high")
            await User.updateOne({"_id": userId}, {$set: {"medal": 10}}).exec();
            break;
        case 50:
            sentToOneUserMessage("notificationToken",message(50),"high")
            await User.updateOne({"_id": userId}, {$set: {"medal": 50}}).exec();
            break;
        case 100:
            sentToOneUserMessage("notificationToken",message(100),"high")
            await User.updateOne({"_id": userId}, {$set: {"medal": 100}}).exec();
            break;
        case 500:
            sentToOneUserMessage("notificationToken",message(500),"high")
            await User.updateOne({"_id": userId}, {$set: {"medal": 500}}).exec();
            break;
        case 1000:
            sentToOneUserMessage("notificationToken",message(1000),"high")
            await User.updateOne({"_id": userId}, {$set: {"medal": 1000}}).exec();
            break;
        default:
            sentToOneUserMessage("notificationToken",message(1000),"high")
    }
}

const message = (medal, isMedal) => {
    if(isMedal) {
        return {
            notification : {
                "title":"דירגו אותך וקיבלת מדליה עם " + medal,
                "body": "בוא ותעשה עוד ג'סטות כדי לעלות בדירוג"
            }
        }
    }
    return {
        notification : {
            "title": "משתמש דירג אותך! בוא ובדוק את הדירוג החדש שלך",
            "body": "בוא ותעשה עוד ג'סטות כדי לעלות בדירוג"
        }
    }
}
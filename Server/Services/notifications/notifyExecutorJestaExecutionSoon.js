const Favor = require("../../Models/favors/Favor");

const logger = require("../../logger");
const {sentToOneUserMessage} = require("../firebase-messaging");

exports.run = async () => {
    logger.debug("notify service: notifyExecutorJestaExecutionSoon is running")
    let dateNow = new Date();
    let futureDate = new Date(dateNow.getTime() + 15*60000) // in a 15 min
    let favors = await Favor.find({dateToExecute: {$gt : dateNow, $lt: futureDate}}).populate("handledByUserId").exec();
    favors.forEach(favor => {
        logger.debug("notify to: " + favor["handledByUserId"]["email"])
        if (favor["handledByUserId"]["notificationToken"] === undefined || favor["handledByUserId"]["notificationToken"] === null) {
            logger.debug(favor["handledByUserId"]["email"] + " doesnt have token");
        } else {
            const message = {
                notification : {
                    "title":"מזכירים לך שבקרוב יש לך ג'סטה לבצע!",
                    "body": "בוא בדוק איזה"
                }
            }
            sentToOneUserMessage(favor["handledByUserId"]["notificationToken"], message, "high")
        }
    })
    logger.debug("notify service: notifyExecutorJestaExecutionSoon is done")
}

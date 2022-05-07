const Favor = require("../../Models/favors/Favor");

const logger = require("../../logger");
const {sentToOneUserMessage} = require("../firebase-messaging");

exports.run = async () => {
    logger.debug("notify service: notifyJestaExecutionSoon is running")
    let dateNow = new Date();
    let futureDate = new Date(dateNow.getTime() + 15*60000) // in a 15 min
    let favors = await Favor.find({dateToExecute: {$gt : dateNow, $lt: futureDate}}).populate("ownerId").exec();
    favors.forEach(favor => {
        logger.debug("notify to: " + favor["ownerId"]["email"])
        if (favor["ownerId"]["notificationToken"] === undefined || favor["ownerId"]["notificationToken"] === null) {
            logger.debug(favor["ownerId"]["email"] + " doesnt have token");
        } else {
            const message = {
                notification : {
                    "title":"מזכירים לך שבקרוב יש לך ג'סטה לבצע!",
                    "body": "בוא בדוק איזה"
                }
            }
            sentToOneUserMessage(favor["ownerId"]["notificationToken"], message, "high")
        }
    })
    logger.debug("notify service: notifyJestaExecutionSoon is done")
}

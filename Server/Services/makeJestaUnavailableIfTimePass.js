const Favor = require("../Models/favors/Favor");
const FavorTransaction = require("../Models/favors/FavorTransactions");
const logger = require("../logger");
const {JESTA_STATUS, JESTA_TRANSACTION_STATUS} = require("../Models/Common/consts");

exports.run = async () => {
    logger.debug("notify service: makeJestaUnavailableIfTimePass is running")
    let dateNow = new Date();
    let futureDate = new Date(dateNow.getTime() + 15*60000) // in a 15 min
    let favors = await Favor.find({dateToExecute: {$gt : dateNow, $lt: futureDate}}).exec();
    for (const favor of favors) {
        await Favor.updateOne({_id:favor["_id"]},{status: JESTA_STATUS.UNAVAILABLE}).exec();
        await FavorTransaction.updateMany({favorId:favor["_id"],status: JESTA_TRANSACTION_STATUS.WAITING_FOR_MORE_APPROVAL},{status:JESTA_TRANSACTION_STATUS.CANCELED}).exec();
    }
    logger.debug("notify service: makeJestaUnavailableIfTimePass is done")
}

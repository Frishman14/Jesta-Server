const util = require("util");

const FavorTransactions = require("../../Models/favors/FavorTransactions");
const Favor = require("../../Models/favors/Favor");
const User = require("../../Models/User");

const logger = require("../../logger");

exports.run = async () => {
    logger.debug("flag the most volunteered service is running")
    var aggregatedAnswer = await FavorTransactions.aggregate([
        {
            $lookup: {
                "from": "favors",
                "localField": "favorId",
                "foreignField": "_id",
                "as": "favors"
            }
        },
        {
            $match : { "status": "JESTA_DONE", "favors.paymentAmount": 0 }
        },
        {
            $group: {
                _id: "$handledByUserId",
                countHandled: {$sum: 1},
            }
        },
        {
            $sort: {"countHandled": -1}
        },
        {
            $limit: 2
        },
    ],  { allowDiskUse : true })
    logger.debug("the 2 most volunteered: " + util.inspect(aggregatedAnswer,false,null,true))
    Favor.updateMany({mostVolunteeredOwner: true}, {mostVolunteeredOwner: false},function (){});
    User.updateMany({mostVolunteered: true}, {mostVolunteered: false},function (){});
    aggregatedAnswer.forEach(volunteer => {
        Favor.updateMany({_id: volunteer._id}, {mostVolunteeredOwner: true},function (){});
        User.updateMany({_id: volunteer._id}, {mostVolunteered: true},function (){});
    })
    logger.debug("flag the most volunteered service is done")
}

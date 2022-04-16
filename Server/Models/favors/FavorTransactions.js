const mongoose = require('mongoose');
const constants = require("../Common/consts");
const validation = require("../Common/Validations");

let favorTransactionSchema = module.exports = mongoose.Schema({
    favorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "favor",
        required: "favor must have a favorId"
    },
    favorOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: "favor must have a owner"
    },
    handledByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: "must be handled by a user"
    },
    status: {
        type: String,
        default: constants.JESTA_TRANSACTION_STATUS.WAITING,
        validate: [validation.validateJestaTransactionStatus, "invalid status"]
    },
    handlerComment: {
        type: String
    },
    ownerComment: {
        type: String
    },
    dateAccepted: {
        type: Date
    },
    dateCompleted: {
        type: Date
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    },
    dateLastModified: {
        type: Date,
        default: Date.now()
    },
    canceledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }
});

let FavorTransaction = module.exports = mongoose.model('favorTransaction', favorTransactionSchema);

module.exports.get = function(callback, limit){
    FavorTransaction.find(callback).limit(limit);
}
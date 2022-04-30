const mongoose = require('mongoose');
const { addressSchema } = require("../Common/Address");
const constants = require("../Common/consts");
const validation = require("../Common/Validations");

let favorSchema = module.exports = mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: "favor must have a user"
    },
    categoryId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "category",
        required: "favor must have a category"
    },
    numOfPeopleNeeded: {
        type: Number,
        default: 1,
    },
    sourceAddress: {
        type: addressSchema,
        required: "must have an address",
    },
    destinationAddress: {
        type: addressSchema,
    },
    description: {
        type: String
    },
    imagesPath: {
        type: [String]
    },
    paymentAmount: {
        type: Number,
        default: 0
    },
    dateToPublish: {
        type: Date,
        default: Date.now()
    },
    dateToExecute: {
        type: Date,
        default:   () => new Date(+new Date() + 31*24*60*60*1000)
    },
    dateToFinishExecute: {
        type: Date
    },
    dateLockedOut: {
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
    paymentMethod: {
        type: String,
    },
    status: {
        type: String,
        default: constants.JESTA_STATUS.AVAILABLE,
        validate: [validation.validateJestaStatus, "invalid status"]
    },
    mostVolunteeredOwner: {
        type: Boolean,
        default: false
    }
});

let Favor = module.exports = mongoose.model('favor', favorSchema);

module.exports.get = function(callback, limit){
    Favor.find(callback).limit(limit);
}
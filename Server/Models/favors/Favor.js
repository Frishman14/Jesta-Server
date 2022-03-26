const mongoose = require('mongoose');
const { addressSchema } = require("../Common/Address");

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
        type: Date
    },
    dateToUnpublished: {
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
    }
});

let Favor = module.exports = mongoose.model('favor', favorSchema);

module.exports.get = function(callback, limit){
    Favor.find(callback).limit(limit);
}
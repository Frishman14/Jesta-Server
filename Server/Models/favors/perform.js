const mongoose = require('mongoose');
const { addressSchema } = require("../Common/Address");
const { activityDays } = require("../Common/activityDays");

let performSchema = module.exports = mongoose.Schema({
    performId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "favor must have a user"
    },
    categoryId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Category",
        required: "favor must have a category"
    },
    addressPreference: {
        type: addressSchema,
    },
    minimumPaymentAmount: {
        type: Number,
    },
    activityDays: {
        type: activityDays
    },
    activityHoursStart: {
        type: Date
    },
    address: {
        type: addressSchema
    },
    locationLatitude: {
        type: Number
    },
    locationLongitude: {
        type: Number
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    },
    dateLastModified: {
        type: Date,
        default: Date.now()
    },
    preferredPaymentMethod: {
        type: String,
    }
});

let Perform = module.exports = mongoose.model('perform', performSchema);

module.exports.get = function(callback, limit){
    Perform.find(callback).limit(limit);
}
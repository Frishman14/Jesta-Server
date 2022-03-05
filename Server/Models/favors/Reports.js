const mongoose = require('mongoose');
const constants = require("../Common/consts");
const validation = require("../Common/Validations");

let reportSchema = module.exports = mongoose.Schema({
    favorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Favor",
        required: "must have a favor"
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "must have a user",
    },
    subject: {
        type: String,
        required: "must have a subject",
    },
    body: {
        type: String,
        required: "must have a body",
    },
    status: {
        type: String,
        default: constants.REPORT_STATUS.PENDING,
        validate: [validation.validateReportsStatuses, "invalid status"]
    },
    result: {
        type: String,
        validate: [validation.validateResult, "invalid result"]
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    },
    dateHandled: {
        type: Date,
    },
    preferredPaymentMethod: {
        type: String,
    }
});

let ReportFavor = module.exports = mongoose.model('report', reportSchema);

module.exports.get = function(callback, limit){
    ReportFavor.find(callback).limit(limit);
}
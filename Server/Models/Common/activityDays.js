const mongoose = require('mongoose');

exports.activityDays = mongoose.Schema({
    sunday: {
        type: Boolean,
        default: false
    },
    monday: {
        type: Boolean,
        default: false
    },
    tuesday: {
        type: Boolean,
        default: false
    },
    wednesday: {
        type: Boolean,
        default: false
    },
    thursday: {
        type: Boolean,
        default: false
    },
    friday: {
        type: Boolean,
        default: false
    },
    saturday: {
        type: Boolean,
        default: false
    },
});

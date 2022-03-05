const mongoose = require('mongoose');

let NotificationSchema = module.exports = mongoose.Schema({
    userId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: "favor must have a user"
    },
    description: {
        type: String,
        description: "must have notification description"
    },
    sentDate: {
        type: Date,
        required: "must have a sent date"
    },
});

let Notification = module.exports = mongoose.model('Notification', NotificationSchema);

module.exports.get = function(callback, limit){
    NotificationSchema.find(callback).limit(limit);
}


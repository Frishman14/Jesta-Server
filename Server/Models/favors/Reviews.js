const mongoose = require('mongoose');

let reviewSchema = module.exports = mongoose.Schema({
    favorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Favor",
        required: "must have a favor"
    },
    reviewedOnUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "must have a user",
    },
    reviewedBnUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "must have a user",
    },
    rating: {
        type: Number,
        required: "must have a rating",
    },
    description: {
        type: String,
        required: "must have a body",
    },
    dateEntered: {
        type: Date,
        default: Date.now()
    },
});

let ReviewFavor = module.exports = mongoose.model('review', reviewSchema);

module.exports.get = function(callback, limit){
    ReviewFavor.find(callback).limit(limit);
}
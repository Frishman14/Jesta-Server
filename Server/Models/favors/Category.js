const mongoose = require('mongoose');

let CategorySchema = module.exports = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: "must enter a category name"
    },
    dateLastModified: {
        type: Date,
        default: Date.now(),
    },
});

let Category = module.exports = mongoose.model('category', CategorySchema);

module.exports.get = function(callback, limit){
    CategorySchema.find(callback).limit(limit);
}


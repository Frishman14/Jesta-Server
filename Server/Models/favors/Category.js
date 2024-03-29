const mongoose = require('mongoose');

let CategorySchema = module.exports = mongoose.Schema({
    name: {
        type: String,
        required: "must enter a category name"
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId, ref: "category"
    },
    dateLastModified: {
        type: Date,
        default: Date.now(),
    },
}).index({name: 1, parentCategory: 1}, {unique: true});

module.exports = mongoose.model('category', CategorySchema);

module.exports.get = function(callback, limit){
    CategorySchema.find(callback).limit(limit);
}


const mongoose = require('mongoose');

let UserCreatedGraph = module.exports = mongoose.Schema({
    creationDate: {
        type: String
    },
    numberOfCreated: {
        type: Number
    }
}).index({creationDate: 1}, {unique: true});

module.exports = mongoose.model('userGraph', UserCreatedGraph);



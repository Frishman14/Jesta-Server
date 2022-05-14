const mongoose = require('mongoose');

let JestaCreatedGraph = module.exports = mongoose.Schema({
    creationDate: {
        type: String
    },
    numberOfCreated: {
        type: Number
    }
}).index({creationDate: 1}, {unique: true});

module.exports = mongoose.model('jestaGraph', JestaCreatedGraph);



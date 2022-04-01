const mongoose = require('mongoose');

exports.GeoSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "Point"
    },
    coordinates: {
        type: [Number],
        index: "2dsphere",
        default: [0.0,0.0]
    }
})

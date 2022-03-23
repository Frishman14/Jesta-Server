const mongoose = require('mongoose');
const { GeoSchema } = require('./geoSchema');

exports.addressSchema = mongoose.Schema({
    fullAddress: {type: String},
    location: GeoSchema,
});

const mongoose = require('mongoose');

exports.addressSchema = mongoose.Schema({
    country: {
        type: String,
        required: "must enter a country"
    },
    city: {
        type: String,
        required: "must enter a City"
    },
    street: {
        type: String,
        required: "must enter a Street"
    }
});

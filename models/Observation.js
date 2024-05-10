const mongoose = require('mongoose');

// Define the observation schema
const ObservationSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    timeZoneOffset: {
        type: String,
        required: true
    },
    coordinates: {
        w3w: String,
        decimalDegrees: {
            latitude: Number,
            longitude: Number
        }
    },
    temperature: {
        landSurface: Number,
        seaSurface: Number
    },
    humidity: {
        type: Number,
        required: true
    },
    wind: {
        speed: Number,
        direction: Number
    },
    precipitation: {
        type: Number,
        required: true
    },
    haze: {
        type: Number,
        required: true
    },
    notes: String
});

// Create model from schema
const Observation = mongoose.model('Observation', ObservationSchema);

module.exports = Observation;

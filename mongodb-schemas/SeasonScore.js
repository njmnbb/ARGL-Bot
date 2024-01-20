const { Schema, model } = require("mongoose");

const seasonScoreSchema = new Schema({
    season: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    }
});

module.exports = seasonScoreSchema;
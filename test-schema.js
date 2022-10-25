const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    discordId: {
        type: Number,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        require: true
    }
});

module.exports = mongoose.model('users', schema);
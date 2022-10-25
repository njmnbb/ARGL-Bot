const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    discordId: {
        type: String,
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
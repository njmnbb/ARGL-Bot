const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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

userSchema.statics.findAndSortAllUsers = function() {
    return this.find().sort({ score: -1 });
}

userSchema.statics.increaseScore = function(authorId) {
    return this.updateOne({ discordId: authorId }, { $inc: { score: 1 } });
}

userSchema.statics.decreaseScore = function(authorId) {
    return this.updateOne({ discordId: authorId }, { $inc: { score: -1 } });
}

module.exports = mongoose.model('users', userSchema);
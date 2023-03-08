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
    },
    isUserTimedOut: {
        type: Boolean,
        require: false
    }
});

userSchema.statics.findAndSortAllUsers = function() {
    return this.find().sort({ score: -1 });
}

userSchema.statics.increaseScore = function(authorId) {
    // return this.updateOne({ discordId: authorId }, { $inc: { score: 1 } });
    return this.collection.findOneAndUpdate({ discordId: authorId }, {$inc : {score: 1 } }, { returnDocument: 'after' } );
}

userSchema.statics.decreaseScore = function(authorId) {
    return this.updateOne({ discordId: authorId }, { $inc: { score: -1 } });
}

userSchema.statics.timeOutUser = function(replierId) {
    return this.updateOne({ discordId: replierId }, { isUserTimedOut: true });
}

userSchema.statics.unTimeOutUser = function(replierId) {
    return this.updateOne({ discordId: replierId }, { isUserTimedOut: false });
}

userSchema.statics.checkUsersTimeoutStatus = function(replierId) {
    return this.findOne({ discordId: replierId });
}

module.exports = mongoose.model('users', userSchema);
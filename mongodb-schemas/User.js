const { Schema, model } = require("mongoose");
const seasonScoreSchema = require("./SeasonScore");

const userSchema = new Schema({
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
        required: true
    },
    isUserTimedOut: {
        type: Boolean,
        required: false
    },
    serverId: {
        type: String,
        required: true
    },
    isBanned: {
        type: Boolean,
        required: false
    },
    seasonScores: [seasonScoreSchema]
});

userSchema.statics.findAndSortAllUsers = function (season) {
    return this.aggregate([{
        $project: {
            displayName: 1,
            score: 1,
            seasonScores: {
                $map: {
                    input: {
                        $filter: {
                            input: '$seasonScores',
                            as: 'item',
                            cond: {
                                $eq: [
                                    '$$item.season',
                                    season
                                ]
                            }
                        }
                    },
                    as: 'item',
                    in: {
                        score: '$$item.score'
                    }
                }
            }
        }
    }]).sort({ 'seasonScores.score': -1 });
}

userSchema.statics.increaseScore = function (authorId, season) {
    return this.findOneAndUpdate({ discordId: authorId, 'seasonScores.season': season }, { $inc: { score: 1, 'seasonScores.$.score': 1 } }, { returnDocument: 'after' });
}

userSchema.statics.decreaseScore = function (authorId, season) {
    return this.updateOne({ discordId: authorId, 'seasonScores.season': season }, { $inc: { score: -1, 'seasonScores.$.score': -1 } }, { returnDocument: 'after' });
}

userSchema.statics.timeOutUser = function (replierId) {
    return this.updateOne({ discordId: replierId }, { isUserTimedOut: true });
}

userSchema.statics.unTimeOutUser = function (replierId) {
    return this.updateOne({ discordId: replierId }, { isUserTimedOut: false });
}

userSchema.statics.checkUsersTimeoutStatus = function (replierId) {
    return this.findOne({ discordId: replierId });
}

module.exports = model('users', userSchema);
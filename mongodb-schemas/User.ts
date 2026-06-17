import { Schema, model, Model, Document, Types } from 'mongoose';
import seasonScoreSchema, { SeasonScore } from './SeasonScore';

export interface AggregatedUser {
    displayName: string;
    score: number;
    isBanned?: boolean;
    seasonScores: { score: number }[];
}

export interface UserDocument extends Document {
    discordId: string;
    displayName: string;
    score: number;
    isUserTimedOut?: boolean;
    serverId: string;
    isBanned?: boolean;
    seasonScores: Types.DocumentArray<SeasonScore>;
}

export interface UserModel extends Model<UserDocument> {
    findAndSortAllUsers(season: number): Promise<AggregatedUser[]>;
    increaseScore(authorId: string, season: number): Promise<UserDocument | null>;
    decreaseScore(authorId: string, season: number): Promise<unknown>;
    timeOutUser(replierId: string): Promise<unknown>;
    unTimeOutUser(replierId: string): Promise<unknown>;
    checkUsersTimeoutStatus(replierId: string): Promise<UserDocument | null>;
    addSeason(season: number): Promise<unknown>;
}

const userSchema = new Schema<UserDocument, UserModel>({
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

userSchema.statics.findAndSortAllUsers = function (season: number) {
    return this.aggregate([{
        $project: {
            displayName: 1,
            score: 1,
            isBanned: 1,
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
};

userSchema.statics.increaseScore = function (authorId: string, season: number) {
    return this.findOneAndUpdate({ discordId: authorId, 'seasonScores.season': season }, { $inc: { score: 1, 'seasonScores.$.score': 1 } }, { returnDocument: 'after' });
};

userSchema.statics.decreaseScore = function (authorId: string, season: number) {
    return this.updateOne({ discordId: authorId, 'seasonScores.season': season }, { $inc: { score: -1, 'seasonScores.$.score': -1 } }, { returnDocument: 'after' });
};

userSchema.statics.timeOutUser = function (replierId: string) {
    return this.updateOne({ discordId: replierId }, { isUserTimedOut: true });
};

userSchema.statics.unTimeOutUser = function (replierId: string) {
    return this.updateOne({ discordId: replierId }, { isUserTimedOut: false });
};

userSchema.statics.checkUsersTimeoutStatus = function (replierId: string) {
    return this.findOne({ discordId: replierId });
};

userSchema.statics.addSeason = function (season: number) {
    return this.updateMany({ $push: { seasonScores: { season: season++, score: 0 } } });
};

export default model<UserDocument, UserModel>('users', userSchema);

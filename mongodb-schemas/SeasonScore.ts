import { Schema } from 'mongoose';

export interface SeasonScore {
    season: number;
    score: number;
}

const seasonScoreSchema = new Schema<SeasonScore>({
    season: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    }
});

export default seasonScoreSchema;

import mongoose from "mongoose";

const { Schema } = mongoose

const ScoreSchema = new Schema({
    missionTitle: {
        type: String,
        required: false // If we set this to true it does not work and I don't know why
    },
    points: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => new Date().toISOString().split('T')[0],
        required: true
      }
})

export default ScoreSchema
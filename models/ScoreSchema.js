import mongoose from "mongoose";

const { Schema } = mongoose

const ScoreSchema = new Schema({
    points: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
        required: true
      }
})

export default ScoreSchema
import mongoose from "mongoose";

const { Schema } = mongoose

const HistoricRecord = new Schema({
    createdAt: {
        type: Date,
        default: new Date(),
        required: true
      },
    historicScore: {
        type: Number,
        required: true
    }
})

export default HistoricRecord
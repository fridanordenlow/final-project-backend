import mongoose from "mongoose";
import crypto from "crypto";
// import HistoricRecordSchema from "./HistoricRecordSchema";

const { Schema } = mongoose

// const HistoricRecord = mongoose.model("HistoricRecord", HistoricRecordSchema)

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  // Hur definierar man att bara "mailadress-form" accepteras?
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  },
  dailyScore: [
    {
      points: {
        type: Number,
        default: null
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
  // historicRecord: {
  //   type: [HistoricRecordSchema]
  // }
  // Possibly connecting missions to the user later
  // missions: {}
});


UserSchema.methods.getTodaysPoints = function() {
  const today = new Date().setHours(0, 0, 0, 0); // Get today's date at midnight

  const filteredScores = this.dailyScore.filter(score => {
    const scoreDate = new Date(score.date).setHours(0, 0, 0, 0); // Get the score's date at midnight
    return scoreDate === today;
  });

  const totalPoints = filteredScores.reduce((sum, score) => sum + score.points, 0);

  return totalPoints;
};

export default UserSchema
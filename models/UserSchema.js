import mongoose from "mongoose";
import crypto from "crypto";
import ScoreSchema from "./ScoreSchema";

const { Schema } = mongoose

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
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
  dailyScores: {
    type: [ScoreSchema],
    default: []
  }
});

export default UserSchema
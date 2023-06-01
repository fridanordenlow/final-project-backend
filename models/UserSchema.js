import mongoose from "mongoose";
import crypto from "crypto";
import HistoricRecordSchema from "./HistoricRecordSchema";

const { Schema } = mongoose

const HistoricRecord = mongoose.model("HistoricRecord", HistoricRecordSchema)

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
  score: {
    type: Number,
    default: null
  },
  historicRecord: {
    type: [HistoricRecordSchema] // Borde vara [HistoricRecord] emn då crashar Emilias app...?!
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
  // Possibly connecting missions to the user later
  // missions: {}
});

export default UserSchema
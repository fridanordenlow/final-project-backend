import mongoose from "mongoose";

const { Schema } = mongoose

const MissionSchema = new Schema({
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
    },
    extraInfo: {
      type: String
    },
    points: {
      type: Number,
      required: true,
    }
  });

  export default MissionSchema
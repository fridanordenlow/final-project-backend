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
    // createdAt: {
    //   type: Date,
    //   default: new Date(),
    //   required: true
    // },
    // Not necessary yet? Stretch goal for users to post their own missions
    // user: {
    //   type: String,
    //   required: true
    // }
  });

  export default MissionSchema
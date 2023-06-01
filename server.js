import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import bcrypt from "bcrypt";
import UserSchema from "./models/UserSchema";
import MissionSchema from "./models/MissionSchema";
import authenticateUser from "./controllers/authenticateUser";
import HistoricRecord from "./models/HistoricRecordSchema";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Our imported data models
const User = mongoose.model("User", UserSchema)
const Mission = mongoose.model("Mission", MissionSchema)

// Start defining your routes here
app.get("/", (req, res) => {
  res.send(listEndpoints(app));
});

// Register new users (post user to database)
app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body
  if (password.length < 8 || password.length > 30) {
    res.status(400).json({success: false, message: "Password needs to be minimum 8 characters and maximum 30 characters"}) 
  }
  try {
    const salt = bcrypt.genSaltSync()
    const newUser = await new User ({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: bcrypt.hashSync(password, salt)
    }).save()
    res.status(201).json({
      success: true,
      message: "Registration successful",
      response: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        id: newUser._id,
        accessToken: newUser.accessToken
      }
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Registration failed",
      response: err
    })
  }
});

// Log in 
app.post("/login", async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({email: email})
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        message: "Login successful",
        response: {
          email: user.email,
          id: user._id,
          accessToken: user.accessToken
        } 
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Could not login, login details do not match"
      })
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      response: err
    })
  }
});

// GET single user
app.get("/users/:userId", authenticateUser)
app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params
  try {
    const user = await User.findById(userId)
    res.status(200).json({
      success: true,
      response: user,
      message: "User found"
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "User could not be found"
    })
  }
})

// // PATCH single user's score
// app.patch("/users/:userId/score", authenticateUser)
// app.patch("/users/:userId/score", async (req, res) => {
//   const { userId } = req.params
//   const { points } = req.body; // Assuming the points are sent in the request body, make sure the points data is being sent properly in the request payload.

//   try {
//     const user = await User.findById(userId)
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       })
//     }

//     user.score += points
//     await user.save()

//     res.status(200).json({
//       success: true,
//       response: user,
//       message: "User score updated successfully"
//     })
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       response: err,
//       message: "Error, could not update user score"
//     })
//   }
// })

// PATCH single user's score from specific mission
app.patch("/users/:userId/collect-points/:missionId", authenticateUser);
app.patch("/users/:userId/collect-points/:missionId", async (req, res) => {
  const { userId, missionId } = req.params;
  const accessToken = req.header("Authorization")
  
  try {
    const user = await User.findOne({_id: userId, accessToken})
    // const user = await User.findById(userId);
    const mission = await Mission.findById(missionId);
  
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found",
      });
    }
    
    user.score += mission.points;
    await user.save();

    res.status(200).json({
      success: true,
      response: user,
      message: `Good job! ${mission.points} points collected`,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "An error occurred",
    });
  }
});

// GET user score
app.get("/users/:userId/user-score", authenticateUser)
app.get("/users/:userId/user-score", async (req, res) => {
  const { userId } = req.params
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findById({_id:userId, accessToken})
    res.status(200).json({
      success: true,
      response: user.score,
      message: `Your score is ${user.score}`
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "User could not be found"
    })
  }
})

// GET user score for specific day
app.get("/users/:userId/:date/score", authenticateUser)
app.get("/users/:userId/:date/score", async (req, res) => {
  const { userId, date } = req.params
  const accessToken = req.header("Authorization")
  try {
    // const user = await User.findById({_id:userId, accessToken, createdAt:date})
    // In this case, "historicRecord.createdAt" should be in quotation marks to indicate that it's a nested field. 
    // The dot notation helps to access the createdAt field within the historicRecord array. "historicRecord.createdAt"
    const user = await User.findOne({ _id: userId, accessToken});
    // const user = await User.findOne({
    //   _id: userId,
    //   accessToken,
    //   "historicRecord.createdAt": date,
    // });
    const record = user.historicRecord.find (record => record.createdAt.toDateString === date)
    if (record) {
      res.status(200).json({
        success: true,
        response: record.historicScore,
        message: `Your score is ${record.historicScore}`
      })
    } else {
      res.status(404).json({
        success: false,
        response: null,
        message: "Score for the specified date not found"
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "Error, something went wrong"
    })
  }
})

// Reset user score
app.post("/users/:userId/reset-score", authenticateUser);
app.post("/users/:userId/reset-score", async (req, res) => {
  const { userId } = req.params;
  const accessToken = req.header("Authorization")
  try {     
    const user = await User.findById({_id:userId, accessToken})
    // Perform any necessary checks or validations before resetting the score
    // For example, you may want to check if the user is authorized to reset the score

    // Reset the user's score to zero
    await User.updateOne({ _id: userId }, { score: 0 });

    res.status(200).json({
      success: true,
      message: "User score has been reset to zero"
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "Failed to reset user score"
    });
  }
});

// Test 
// app.get("/missions", async (req, res) => {
//   try {
//       const missions = await Mission.find()
//       res.status(200).json({
//         success: true,
//         response: missions,
//         message: "Missions found"
//       })
//     } catch (err) {
//     res.status(500).json({
//       success: false,
//       response: err
//     })
//   }
// });

// // GET missions
app.get("/missions", authenticateUser)
// // If they "pass" this is the function that happens next()
app.get("/missions", async (req, res) => {
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findOne({accessToken: accessToken})
    if (user) {
      const missions = await Mission.find() // .populate('user') https://mongoosejs.com/docs/populate.html
      res.status(200).json({
        success: true,
        response: missions,
        message: "Missions found"
      })
    } else {
      res.status(400).json({
        success: false,
        response: "Error, missions could not be retrieved"
      })
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      response: err
    })
  }
});

// POST missions 
app.post("/missions", authenticateUser)
app.post("/missions", async (req, res) => {
  const { title, description, extraInfo, points } = req.body
  // const accessToken = req.header("Authorization")
  try {
    //const user = await User.findOne({accessToken: accessToken})
    const newMission = await new Mission({title, description, extraInfo, points }).save()
    res.status(201).json({
      success: true,
      response: newMission,
      message: "New mission successfully created"
    }) 
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "Error, new mission could not be created"
    })
  }
});

// GET single mission
app.get("/missions/:missionId", authenticateUser)
app.get("/missions/:missionId", async (req, res) => {
  const { missionId } = req.params
  try {
    const mission = await Mission.findById(missionId)
    res.status(200).json({
      success: true,
      response: mission,
      message: "Mission found"
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "Mission could not be found"
    })
  }
})


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
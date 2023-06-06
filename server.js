import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import bcrypt from "bcrypt";
import UserSchema from "./models/UserSchema";
import MissionSchema from "./models/MissionSchema";
import authenticateUser from "./controllers/authenticateUser";

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

// MISSIONS
// GET missions
app.get("/missions", authenticateUser)
app.get("/missions", async (req, res) => {
  const accessToken = req.header("Authorization")

  try {
    const user = await User.findOne({ accessToken: accessToken })

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      })
    }

    const missions = await Mission.find() // .populate('user') https://mongoosejs.com/docs/populate.html

    res.status(200).json({
      success: true,
      response: missions,
      message: "Missions found"
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      response: err,
      message: "Error, missions could not be retrieved"
    })
  }
});


// POST missions 
app.post("/missions", authenticateUser)
app.post("/missions", async (req, res) => {
  const { title, description, extraInfo, points } = req.body
  const accessToken = req.header("Authorization")

  try {
    const user = await User.findOne({accessToken: accessToken})
    
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      })
    }
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
  const accessToken = req.header("Authorization")

  try {
    const user = await User.findOne({accessToken: accessToken})

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      })
    }

    const mission = await Mission.findById(missionId)

    res.status(200).json({
      success: true,
      response: mission,
      message: "Mission found"
    })
  } catch (err) {
    res.status(404).json({
      success: false,
      response: err,
      message: "Mission could not be found"
    })
  }
})


// USERS
// GET single user by id
app.get("/users/:userId", authenticateUser)
app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params
  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      })
    }
    res.status(200).json({
      success: true,
      response: user,
      message: "User found"
    })
  } catch (err) {
    res.status(404).json({
      success: false,
      response: err,
      message: "User could not be found"
    })
  }
})

// PATCH single user's score from specific mission
app.patch("/users/:userId/collect-points/:missionId", authenticateUser);
app.patch("/users/:userId/collect-points/:missionId", async (req, res) => {
  const { userId, missionId } = req.params;
  const accessToken = req.header("Authorization")
  
  try {
    const user = await User.findOne({_id: userId, accessToken})
  
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const mission = await Mission.findById(missionId);
    
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found",
      });
    }
    
    const collectedMissionPoints = {
      missionTitle: mission.title,
      points: mission.points,
      date: new Date().toISOString()
    }

    user.dailyScores.push(collectedMissionPoints)
    // console.log(collectedMissionPoints)

    await user.save();

    res.status(200).json({
      success: true,
      response: collectedMissionPoints,
      message: `Good job! ${mission.points} points collected`,
    });
  } catch (err) {
    console.error(err)
    res.status(400).json({
      success: false,
      response: err,
      message: "An error occurred",
    });
  }
});

// GET a user's total score
app.get("/users/:userId/total-score", authenticateUser)
app.get("/users/:userId/total-score", async (req, res) => {
  const { userId } = req.params
  const accessToken = req.header("Authorization")

  try {
    const user = await User.findById({_id:userId, accessToken})

    if (!user) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "User not found",
      });
    }

    const totalScore = user.dailyScores.reduce((sum, score) => sum + score.points, 0)
    // console.log(totalScore)

    res.status(200).json({
      success: true,
      response: totalScore,
      message: `Your total score is ${totalScore}`
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "An error occurred"
    })
  }
})

// GET user score for specific day
app.get("/users/:userId/score/:date", authenticateUser)
app.get("/users/:userId/score/:date", async (req, res) => {
  const { userId, date } = req.params
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findOne({ _id: userId, accessToken});

    if (!user) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "User not found",
      });
    }

    const filteredScores = user.dailyScores.filter((score) => {
      const scoreDate = new Date(score.createdAt).toISOString().split('T')[0];
      return scoreDate === date;
    });
  
    const totalDailyScore = filteredScores.reduce((sum, score) => {
      return sum + score.points
    }, 0)
  
    if (filteredScores.length > 0) {
      res.status(200).json({
        success: true,
        response: totalDailyScore,
        message: `Your total score today is ${totalDailyScore} points`
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

// POST to reset user score
app.post("/users/:userId/reset-score", authenticateUser);
app.post("/users/:userId/reset-score", async (req, res) => {
  const { userId } = req.params;
  const accessToken = req.header("Authorization")
  
  try {     
    const user = await User.findById({_id: userId, accessToken})

    if (!user) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "User not found",
      });
    }
    
    user.dailyScores = []
    await user.save()

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


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
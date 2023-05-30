import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import crypto from "crypto";
import bcrypt from "bcrypt";

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

// Test

// Start defining your routes here
app.get("/", (req, res) => {
  res.send(listEndpoints(app));
});

// User schema
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
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
  // Possibly connecting missions to the user later
  // missions: {}
});

const User = mongoose.model("User", UserSchema)

// Mission schema
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
  },
  createdAt: {
    type: Date,
    default: new Date()
  }
  // Not necessary yet? Stretch goal for users to post their own missions
  // user: {
  //   type: String,
  //   required: true
  // }
});

const Mission = mongoose.model("Mission", MissionSchema)

// Register new users (post user to database)
app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body
  console.log(req.body)
  if (password.length < 8 || password.length > 30) {
    res.status(400).json({success: false, message: "Password needs to be minimum 8 characters and maximum 30 characters"}) 
  }
  try {
    const salt = bcrypt.genSaltSync() // Obscuring our password
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
    // Comparing the password with the password filled in
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

// Authenticate the user
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization")
  // If we find the user's correct accessToken in the header "Authorization"
  try {
    const user = await User.findOne({accessToken: accessToken})
    if (user) {
      // Calling the next function says that all of the stuff that we get from the req/res, will be transferred to the next function with the same endpoint
      next()
    } else {
    res.status(401).json({
      success: false,
      response: "Please log in"
    });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      response: err
    })
  }
};

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

// PATCH single user's score
app.patch("/users/:userId/score", authenticateUser)
app.patch("/users/:userId/score", async (req, res) => {
  const { userId } = req.params
  const { points } = req.body; // Assuming the points are sent in the request body, make sure the points data is being sent properly in the request payload.

  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    user.score += points
    await user.save()

    res.status(200).json({
      success: true,
      response: user,
      message: "User score updated successfully"
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "Error, could not update user score"
    })
  }
})

app.get("/missions", authenticateUser)
// If they "pass" this is the function that happens next()
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

// app.post("/missions", authenticateUser) do we need authentication here now?
app.post("/missions", authenticateUser)
app.post("/missions", async (req, res) => {
  const { title, description, extraInfo, points } = req.body
  const accessToken = req.header("Authorization")
  try {
    // const user = await User.findOne({accessToken: accessToken})
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

app.patch("/missions/:missionId/points", authenticateUser)
app.patch("/missions/:missionId/points", async (req, res) => {
  const { missionId } = req.params;
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findOne({accessToken: accessToken})
    const mission = await Mission.findById(missionId);
  
    if (mission) {
      user.score += mission.points;
      await user.save();

      const updatedMission = await mission.save();
      res.status(200).json({
        success: true,
        response: updatedMission,
        message: `${updatedMission.id} points collected`,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Mission not found",
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err,
      message: "An error occurred",
    });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
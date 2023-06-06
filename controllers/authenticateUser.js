import mongoose from "mongoose";
import UserSchema from "../models/UserSchema";

const User = mongoose.model("User", UserSchema)

const authenticateUser = async (req, res, next) => {
    const accessToken = req.header("Authorization")
    // If we find the user's correct accessToken in the header "Authorization"
    try {
      const user = await User.findOne({accessToken: accessToken})
      if (user) {
        // Calling the next function says that all of the stuff that we get from the req/res, will be transferred to the next function with the same endpoint
        next()
      } else {
      res.status(403).json({
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

  export default authenticateUser
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { UserDocument } from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../config/jwt";
import { refresh } from "../controllers/userController";

const router = express.Router();

// Start Google OAuth flow
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


// Callback route for Google

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "com.hyper://login",
  }),
  (req, res) => {
    const user = req.user as UserDocument;

    // Generate JWT
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log("Google Callback: User authenticated", user);

    console.log(token);
    console.log(refreshToken);
    console.log(user.userName);

    // Correctly formatted URL
    const appRedirectUrl = `com.hyper://handleLogin?token=${token}&name=${user.userName}&refreshToken=${refreshToken}`;
    // const appRedirectUrl = `exp://192.168.0.135:8081/--login?token=${token}&name=${user.userName}`;
    console.log(appRedirectUrl);
    res.redirect(appRedirectUrl);
  }
);

router.post("/refresh", refresh);

export default router;

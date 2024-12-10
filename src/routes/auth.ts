import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { UserDocument } from "../models/User";
import { generateAccessToken } from "../config/jwt";
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
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user as UserDocument;

    // Generate JWT
    const token = generateAccessToken(user);

    console.log("Google Callback: User authenticated", user);

    // Correctly formatted URL
    const appRedirectUrl = `hyperapp://index?token=${token}&name=${user.userName}`;
    res.redirect(
      appRedirectUrl
    );
  }
);

router.post("/refresh", refresh);

export default router;

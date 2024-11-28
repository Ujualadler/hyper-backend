import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyToken,
} from "../config/jwt";

export const refresh = (req: Request, res: Response) => {
  try {
    console.log(
      "  refreshhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh"
    );
    const cookies = req.cookies;

    if (!cookies?.jwt) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const refreshToken = cookies.jwt;
    const accessToken = verifyAccessToken(refreshToken);

    if (!accessToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    console.log(accessToken + "accessTokem");

    // Send new access token
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail, userPassword } = req.body;

    // Find user by email
    const user = await User.findOne({ userEmail });
    if (!user) {
      res.status(200).json({ message: "Invalid Email" });
      return;
    }

    // Compare password
    const validPassword = await bcrypt.compare(userPassword, user.userPassword);
    if (!validPassword) {
      res.status(200).json({ message: "Invalid Password" });
      return;
    }

    // Update last login time
    user.lastLoginTime = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user); // Await the refresh token generation

    // Set refresh token as HttpOnly cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // Prevents client-side access to the cookie
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "strict", // Lowercase 'strict'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send access token and user details in the response
    res.status(200).json({
      message: "Login Success",
      token: accessToken,
      name: user.userName,
    });
  } catch (e) {
    console.error("Error during login:", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userEmail, userPassword, isAdmin } = req.body;

    const user = await User.findOne({ userEmail });

    if (!user) {
      res.status(200).json({ message: "Invalid Email" });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({ message: "Access Denied: Not an Admin" });
      return;
    }

    // Compare password
    const validPassword = await bcrypt.compare(userPassword, user.userPassword);

    if (!validPassword) {
      res.status(200).json({ message: "Invalid Password" });
      return;
    }

    user.lastLoginTime = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);

    res.json({
      message: "Admin Login Success",
      token: accessToken,
      name: user.userName,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    let { userEmail, userPassword, userName } = req.body;

    const user = await User.findOne({ userEmail: userEmail });
    if (user) {
      res.status(200).json({ message: "User already exist" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);
    await User.create({
      userEmail,
      userPassword: hashedPassword,
      userName,
    });
    res.send({ message: "created successfuly" });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json({ data: users });
  } catch (e) {
    res.status(503).json({ message: "Error occured" });
  }
};

// export const deleteUser = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const deltedUser = await User.deleteOne({ _id: id });
//     res.status(200).json({ message: "Deleted Successfully" });
//   } catch (e) {
//     res.status(503).json({ message: "Error while deleting" });
//   }
// };

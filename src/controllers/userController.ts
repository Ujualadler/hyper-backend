import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyToken,
} from "../config/jwt";
import { deleteFile, uploadAssessment, uploadImages } from "../config/s3";

export const refresh = (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    console.log(`refresh token :${refreshToken}`);

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

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
    
    res.status(200).json({
      message: "Login Success",
      token: accessToken,
      image: user.image,
      refreshToken: refreshToken,
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

export const getProfile = async (
  req: Request | any,
  res: Response
): Promise<void> => {
  try {
    const userID = req.user.id;
    const user = await User.findById({ _id: userID });
    res.status(200).json({ data: user });
  } catch (e) {
    res.status(503).json({ message: "Error occured" });
  }
};

export const postProfile = async (
  req: Request | any,
  res: Response
): Promise<void> => {
  try {
    const userID = req.user.id; // Get user id from the JWT payload

    // Access the uploaded file via req.file
    const file = req.file;
    const { type } = req.body;
    if (!file && type === "add") {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Log file details (optional for debugging)
    console.log("File uploaded:", file);

    const oldUser = await User.findById({ _id: userID });

    if (type === "add" && file) {
      await uploadImages(file);
    }

    deleteFile(`/quiz/${oldUser?.image}`);

    const user = await User.updateOne(
      { _id: userID },
      { image: type === "add" ? file?.filename : null }
    );
    res.status(200).json({ message: "success", image: file?.filename });
  } catch (e) {
    res.status(503).json({ message: "Error occured" });
  }
};

export const changePassword = async (
  req: Request | any,
  res: Response
): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const userId = req.user.id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User  not found." });
      return;
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.userPassword);
    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect." });
      return;
    }

    // Validate new password (you can add more validation as needed)
    if (newPassword.length < 6) {
      res
        .status(400)
        .json({ message: "New password must be at least 6 characters long." });
      return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.userPassword = await bcrypt.hash(newPassword, salt);

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
    return;
  }
};

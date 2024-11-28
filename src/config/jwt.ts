import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { UserDocument } from "../models/User";
import { NextFunction, Request, Response } from "express";

config();

export const generateAccessToken = (user: UserDocument) => {
  return jwt.sign(
    {
      id: user.id,
      userEmail: user.userEmail,
    },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: 3600 } //expires in 30 minut ( 60 * 30 )
  ); // JWT_SECRET is your secret key
};

export const generateRefreshToken = async (user: UserDocument) => {
  const refreshToken = jwt.sign(
    { id: user.id, email: user.userEmail },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );

  // user.refreshToken = refreshToken;
  // await user.save();

  return refreshToken;
};

export const generateEncryptionToken = (videoId: string) => {
  console.log(process.env.JWT_ENCRYPT_SECRET);
  const token = jwt.sign(
    {
      videoId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 1 hour
    },
    process.env.JWT_ENCRYPT_SECRET as string
  );
  return token;
};

export const verifyEncToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(process.env.JWT_ENCRYPT_SECRET);
  // Extract the token from cookies
  const token = req.cookies["authToken"];
  console.log(token);
  if (!token) return res.sendStatus(401); // No token provided

  const secretKey = process.env.JWT_ENCRYPT_SECRET as string;
  jwt.verify(token, secretKey, (err: any, video: any) => {
    console.log("video::", video);
    if (err) return res.sendStatus(403); // Invalid token
    if (video?.videoId === req.params.id) {
      console.log("matching...");
      next(); // Token is valid, proceed to the next middleware
    }
  });
};

export const verifyAccessToken = (refreshToken: string): string | null => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
    const user = decoded as UserDocument;

    // Generate a new access token
    const newAccessToken = generateAccessToken(user);
    return newAccessToken;
  } catch (err) {
    console.error("Invalid refresh token", err);
    return null;
  }
};


export const verifyToken = (req: any, res: any, next: NextFunction) => {
  let token;
  // Check if the token is in the 'Authorization' header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1]; // Extract the token part after 'Bearer '
  }

  console.log("verifyyyyyyyy", token);

  if (!token) {
    return res.sendStatus(401); // Unauthorized if no token is present
  }

  jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string,
    (err: any, decoded: any) => {
      if (err) {
        console.log(err);
        return res.sendStatus(403); // Forbidden if token verification fails
      }
      req.user = decoded; // Optionally attach user info to request

      console.log(req.user);
      next(); // Proceed to the next middleware or route handler
    }
  );
};

import express from "express";

import cors from "cors";

import { F_URL, F_URL2, url } from "./config/url";

import UserRouter from "./routes/userRoutes";
import quizRouter from "./routes/quizz";
import authRoutes from "./routes/auth";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport";

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(passport.initialize()); 

app.use(
  cors({
    origin: [
      F_URL,
      F_URL2,
      "https://docadmin.netlify.app",
      "http://localhost:19006",
      "https://auth.expo.io",
      "http://localhost:4000",
      "http://localhost:8081",
    ], // Your frontend URL
    credentials: true, // Allow credentials (cookies) to be sent
  })
);

app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/quiz", quizRouter);
app.use("/", UserRouter);

export default app;

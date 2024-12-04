import { Router } from "express";
import {
  changePassword,
  getProfile,
  listUsers,
  //   deleteUser,
  //   listUsers,
  login,
  postProfile,
  register,
} from "../controllers/userController";
import passport from "passport";
import { verifyToken } from "../config/jwt";
import multer from "multer";
import { count } from "console";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/login", login);
router.post("/admin/login", login);
router.post("/register", register); 
router.post("/changePassword",verifyToken, changePassword);
router.get("/user/list", listUsers);
router.get("/user/profile", verifyToken, getProfile);
router.post(
  "/user/profile",
  upload.single('image'),
  verifyToken,
  (req, res, next) => {
    console.log("File uploaded:", req.file);
    next();
  },
  postProfile
);

// router.delete("/user/delete/:id", deleteUser);

export default router;
